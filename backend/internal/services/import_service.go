package services

import (
	"encoding/csv"
	"errors"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"strings"

	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"

	"github.com/xuri/excelize/v2"
)

// Auxiliar para achar índice da coluna
func getColIndex(headers []string, colName string) int {
	for i, h := range headers {
		if strings.EqualFold(strings.TrimSpace(h), colName) {
			return i
		}
	}
	return -1
}

// Função Principal que decide como ler baseado na extensão
func ProcessFile(file multipart.File, filename string) error {
	ext := strings.ToLower(filepath.Ext(filename))

	var rows [][]string
	var err error

	if ext == ".xlsx" {
		rows, err = readXLSX(file)
	} else if ext == ".csv" {
		rows, err = readCSV(file)
	} else {
		return errors.New("formato não suportado. Use .csv ou .xlsx")
	}

	if err != nil {
		return err
	}

	if len(rows) < 2 {
		return errors.New("o arquivo parece estar vazio ou sem cabeçalho")
	}

	return processRows(rows)
}

func readCSV(file multipart.File) ([][]string, error) {
	reader := csv.NewReader(file)
	reader.Comma = ';' // Padrão UFES
	reader.LazyQuotes = true
	return reader.ReadAll()
}

func readXLSX(file multipart.File) ([][]string, error) {
	// O excelize precisa do stream ou do arquivo em disco.
	// Como estamos recebendo multipart, vamos abrir o reader diretamente.
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	// Pega a primeira aba (Sheet1 ou a que estiver ativa)
	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, errors.New("nenhuma aba encontrada no Excel")
	}

	// Lê todas as linhas
	return f.GetRows(sheetName)
}

// Lógica de Negócio (Agnóstica de formato)
func processRows(rows [][]string) error {
	headers := rows[0]

	// Mapeamento de Colunas
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
		return errors.New("formato de arquivo inválido: colunas essenciais não encontradas")
	}

	// Itera a partir da linha 1 (pula cabeçalho)
	for _, record := range rows[1:] {
		// Proteção contra linhas vazias no final do arquivo
		if len(record) < idxMatricula {
			continue
		}

		// --- CURSO ---
		codCurso, _ := strconv.Atoi(safeGet(record, idxCodCurso))
		var course models.Course
		database.DB.Where(models.Course{Code: codCurso}).FirstOrCreate(&course)

		valNomeCurso := safeGet(record, idxNomeCurso)
		valCoord := safeGet(record, idxCoord)

		if course.Name != valNomeCurso || course.Coordinator != valCoord {
			course.Code = codCurso
			course.Name = valNomeCurso
			course.Coordinator = valCoord
			database.DB.Save(&course)
		}

		// --- SEMESTRE ---
		var semester models.Semester
		database.DB.FirstOrCreate(&semester, models.Semester{Code: safeGet(record, idxSemestre)})

		// --- ALUNO ---
		var student models.Student
		matr := safeGet(record, idxMatricula)
		database.DB.Where("registration = ?", matr).FirstOrInit(&student)

		student.Registration = matr
		student.Name = safeGet(record, idxNomeAluno)
		student.EntryYear, _ = strconv.Atoi(safeGet(record, idxAnoIngresso))
		student.EntryPeriod = safeGet(record, idxPeriodoIngresso)
		student.QuotaType = safeGet(record, idxCota)
		student.CourseID = course.ID
		database.DB.Save(&student)

		// --- REGISTRO ---
		var academicRecord models.AcademicRecord
		database.DB.Where("student_id = ? AND semester_id = ?", student.ID, semester.ID).FirstOrInit(&academicRecord)

		academicRecord.StudentID = student.ID
		academicRecord.SemesterID = semester.ID
		academicRecord.Status = safeGet(record, idxEnquadramento)
		academicRecord.StatusDetail = safeGet(record, idxAcomp)
		academicRecord.IntegralizedHours, _ = strconv.Atoi(safeGet(record, idxCHI))
		academicRecord.TotalHours, _ = strconv.Atoi(safeGet(record, idxCHTotal))
		academicRecord.PendingObligatory, _ = strconv.Atoi(safeGet(record, idxFaltantes))
		academicRecord.SemestersNoHours, _ = strconv.Atoi(safeGet(record, idxSemestresZero))
		academicRecord.Locks, _ = strconv.Atoi(safeGet(record, idxTrancamentos))

		database.DB.Save(&academicRecord)
	}

	return nil
}

// Evita crash se o índice não existir na linha (comum em CSV mal formatado)
func safeGet(row []string, index int) string {
	if index >= 0 && index < len(row) {
		return row[index]
	}
	return ""
}
