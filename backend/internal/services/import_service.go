package services

import (
	"encoding/csv"
	"errors"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type ImportService struct {
	db *gorm.DB
}

func NewImportService(db *gorm.DB) *ImportService { return &ImportService{db: db} }

// ImportSummary relata o resultado da importação (UC08, fluxo principal,
// passo 7).
type ImportSummary struct {
	TotalRows      int `json:"total_rows"`
	RecordsCreated int `json:"records_created"`
	RecordsUpdated int `json:"records_updated"`
	SkippedRows    int `json:"skipped_rows"`
}

// Process lê o arquivo, valida o cabeçalho e grava todas as linhas em uma
// única transação: ou a planilha inteira entra, ou nada é alterado (RNF-05).
func (s *ImportService) Process(file multipart.File, filename string) (*ImportSummary, error) {
	var rows [][]string
	var err error

	switch strings.ToLower(filepath.Ext(filename)) {
	case ".xlsx":
		rows, err = readXLSX(file)
	case ".csv":
		rows, err = readCSV(file)
	default:
		return nil, Invalid("formato não suportado. Use .csv ou .xlsx")
	}
	if err != nil {
		return nil, Invalid("falha ao ler o arquivo: " + err.Error())
	}

	if len(rows) < 2 {
		return nil, Invalid("o arquivo parece estar vazio ou sem cabeçalho")
	}

	parsed, err := parseRows(rows)
	if err != nil {
		return nil, err
	}

	summary := &ImportSummary{
		TotalRows:   len(rows) - 1,
		SkippedRows: parsed.Skipped,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		return persistRows(tx, parsed.Rows, summary)
	}); err != nil {
		return nil, err
	}
	return summary, nil
}

func readCSV(file multipart.File) ([][]string, error) {
	reader := csv.NewReader(file)
	reader.Comma = ';'
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1 // linhas com contagens diferentes são tratadas no parse
	return reader.ReadAll()
}

func readXLSX(file multipart.File) ([][]string, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, errors.New("nenhuma aba encontrada no Excel")
	}
	return f.GetRows(sheetName)
}

// importRow é a representação neutra de uma linha da planilha, separada
// da persistência para que o mapeamento de colunas seja testável sem
// banco de dados.
type importRow struct {
	SemesterCode string
	CourseCode   int
	CourseName   string
	Coordinator  string

	Registration string
	StudentName  string
	EntryYear    int
	EntryPeriod  string
	QuotaType    string

	Status            string
	StatusDetail      string
	IntegralizedHours int
	TotalHours        int
	PendingObligatory int
	SemestersNoHours  int
	Locks             int
}

type parsedFile struct {
	Rows    []importRow
	Skipped int
}

func getColIndex(headers []string, colName string) int {
	for i, h := range headers {
		if strings.EqualFold(strings.TrimSpace(h), colName) {
			return i
		}
	}
	return -1
}

func safeGet(row []string, index int) string {
	if index >= 0 && index < len(row) {
		return strings.TrimSpace(row[index])
	}
	return ""
}

func atoiOrZero(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}

// parseRows valida o cabeçalho e converte as linhas. Linhas sem
// matrícula, sem semestre ou sem código de curso numérico são contadas
// como ignoradas — nunca geram entidades vazias no banco.
func parseRows(raw [][]string) (*parsedFile, error) {
	headers := raw[0]

	idxSemestre := getColIndex(headers, "PERIODO_BASE_ENQUADRAMENTO")
	idxCodCurso := getColIndex(headers, "COD_CURSO")
	idxNomeCurso := getColIndex(headers, "NOME_CURSO")
	idxCoord := getColIndex(headers, "COORDENADOR_CURSO")

	idxMatricula := getColIndex(headers, "MATR_ALUNO")
	idxNomeAluno := getColIndex(headers, "NOME_ALUNO")
	idxAnoIngresso := getColIndex(headers, "ANO_INGRESSO")
	idxPeriodoIngresso := getColIndex(headers, "PERIODO_INGRESSO")
	idxCota := getColIndex(headers, "TIPO_COTA_INGRESSO")

	idxEnquadramento := getColIndex(headers, "ENQUADRAMENTO")
	idxAcomp := getColIndex(headers, "ACOMPANHAMENTO_ENQUADRAMENTO")
	idxCHI := getColIndex(headers, "CH_INTEGRALIZADA")
	idxCHTotal := getColIndex(headers, "CH_TOTAL_DISCIPLINAS_CONTAR")
	idxFaltantes := getColIndex(headers, "NUM_DISC_OBR_FALTANTES")
	idxSemestresZero := getColIndex(headers, "NUM_SEMESTRES_SEM_CH")
	idxTrancamentos := getColIndex(headers, "NUM_TRANCAMENTOS")

	if idxSemestre == -1 || idxMatricula == -1 {
		return nil, Invalid("formato de arquivo inválido: colunas essenciais não encontradas")
	}

	parsed := &parsedFile{}
	for _, record := range raw[1:] {
		registration := safeGet(record, idxMatricula)
		semesterCode := safeGet(record, idxSemestre)
		courseCode, convErr := strconv.Atoi(safeGet(record, idxCodCurso))

		if registration == "" || semesterCode == "" || convErr != nil || courseCode == 0 {
			parsed.Skipped++
			continue
		}

		parsed.Rows = append(parsed.Rows, importRow{
			SemesterCode:      semesterCode,
			CourseCode:        courseCode,
			CourseName:        safeGet(record, idxNomeCurso),
			Coordinator:       safeGet(record, idxCoord),
			Registration:      registration,
			StudentName:       safeGet(record, idxNomeAluno),
			EntryYear:         atoiOrZero(safeGet(record, idxAnoIngresso)),
			EntryPeriod:       safeGet(record, idxPeriodoIngresso),
			QuotaType:         safeGet(record, idxCota),
			Status:            safeGet(record, idxEnquadramento),
			StatusDetail:      safeGet(record, idxAcomp),
			IntegralizedHours: atoiOrZero(safeGet(record, idxCHI)),
			TotalHours:        atoiOrZero(safeGet(record, idxCHTotal)),
			PendingObligatory: atoiOrZero(safeGet(record, idxFaltantes)),
			SemestersNoHours:  atoiOrZero(safeGet(record, idxSemestresZero)),
			Locks:             atoiOrZero(safeGet(record, idxTrancamentos)),
		})
	}
	return parsed, nil
}

// persistRows grava as linhas dentro da transação recebida. Cursos,
// semestres, alunos e registros são pré-carregados em mapas — as buscas
// repetidas por linha (padrão N+1) são eliminadas.
func persistRows(tx *gorm.DB, rows []importRow, summary *ImportSummary) error {
	var allCourses []models.Course
	if err := tx.Find(&allCourses).Error; err != nil {
		return err
	}
	courses := make(map[int]*models.Course, len(allCourses))
	for i := range allCourses {
		courses[allCourses[i].Code] = &allCourses[i]
	}

	var allSemesters []models.Semester
	if err := tx.Find(&allSemesters).Error; err != nil {
		return err
	}
	semesters := make(map[string]*models.Semester, len(allSemesters))
	for i := range allSemesters {
		semesters[allSemesters[i].Code] = &allSemesters[i]
	}

	var allStudents []models.Student
	if err := tx.Find(&allStudents).Error; err != nil {
		return err
	}
	students := make(map[string]*models.Student, len(allStudents))
	for i := range allStudents {
		students[allStudents[i].Registration] = &allStudents[i]
	}

	type recordKey struct{ StudentID, SemesterID uint }
	var allRecords []models.AcademicRecord
	if err := tx.Find(&allRecords).Error; err != nil {
		return err
	}
	records := make(map[recordKey]*models.AcademicRecord, len(allRecords))
	for i := range allRecords {
		r := &allRecords[i]
		records[recordKey{r.StudentID, r.SemesterID}] = r
	}

	for i := range rows {
		row := &rows[i]

		course := courses[row.CourseCode]
		if course == nil {
			course = &models.Course{Code: row.CourseCode, Name: row.CourseName, Coordinator: row.Coordinator}
			if err := tx.Create(course).Error; err != nil {
				return err
			}
			courses[row.CourseCode] = course
		} else if course.Name != row.CourseName || course.Coordinator != row.Coordinator {
			course.Name = row.CourseName
			course.Coordinator = row.Coordinator
			if err := tx.Save(course).Error; err != nil {
				return err
			}
		}

		semester := semesters[row.SemesterCode]
		if semester == nil {
			semester = &models.Semester{Code: row.SemesterCode}
			if err := tx.Create(semester).Error; err != nil {
				return err
			}
			semesters[row.SemesterCode] = semester
		}

		student := students[row.Registration]
		if student == nil {
			student = &models.Student{Registration: row.Registration}
			students[row.Registration] = student
		}
		student.Name = row.StudentName
		student.EntryYear = row.EntryYear
		student.EntryPeriod = row.EntryPeriod
		student.QuotaType = row.QuotaType
		student.CourseID = course.ID
		if err := tx.Save(student).Error; err != nil {
			return err
		}

		key := recordKey{student.ID, semester.ID}
		record := records[key]
		isNew := record == nil
		if isNew {
			record = &models.AcademicRecord{StudentID: student.ID, SemesterID: semester.ID}
			records[key] = record
		}
		record.Status = row.Status
		record.StatusDetail = row.StatusDetail
		record.IntegralizedHours = row.IntegralizedHours
		record.TotalHours = row.TotalHours
		record.PendingObligatory = row.PendingObligatory
		record.SemestersNoHours = row.SemestersNoHours
		record.Locks = row.Locks
		if err := tx.Save(record).Error; err != nil {
			return err
		}

		if isNew {
			summary.RecordsCreated++
		} else {
			summary.RecordsUpdated++
		}
	}
	return nil
}
