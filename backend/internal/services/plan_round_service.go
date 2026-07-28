package services

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type PlanRoundService struct {
	db *gorm.DB
}

func NewPlanRoundService(db *gorm.DB) *PlanRoundService { return &PlanRoundService{db: db} }

// CohortStudent é um aluno do grupo de uma rodada (PAE/PIC no semestre-base).
type CohortStudent struct {
	Registration string `json:"registration"`
	Name         string `json:"name"`
	Status       string `json:"status"`
}

// StudentRoundEntry é uma rodada do ponto de vista do aluno: a rodada, o
// enquadramento dele no semestre-base e as disciplinas já registradas em
// cada período. Alimenta a área do aluno (histórico + rodada editável).
type StudentRoundEntry struct {
	Round              models.PlanRound
	Status             string
	Period1Disciplines []models.Discipline
	Period2Disciplines []models.Discipline
}

// Open abre uma rodada para os dois períodos informados (RN17). O
// semestre-base é o último com dados no momento da abertura (RN21) e fica
// gravado como snapshot. Fecha qualquer rodada aberta e cria a nova aberta
// na mesma transação — invariante de no máximo uma aberta (RN19).
func (s *PlanRoundService) Open(period1Code, period2Code string, userID uint) (*models.PlanRound, error) {
	period1Code = strings.TrimSpace(period1Code)
	period2Code = strings.TrimSpace(period2Code)

	if period1Code == "" || period2Code == "" {
		return nil, Invalid("informe os dois períodos da rodada")
	}
	if period1Code == period2Code {
		return nil, Invalid("os dois períodos devem ser diferentes")
	}

	var round models.PlanRound
	err := s.db.Transaction(func(tx *gorm.DB) error {
		base, err := latestDataSemester(tx)
		if err != nil {
			return err
		}
		if base == nil {
			return Invalid("importe dados acadêmicos antes de abrir uma rodada")
		}

		sem1, err := ensureSemester(tx, period1Code)
		if err != nil {
			return err
		}
		sem2, err := ensureSemester(tx, period2Code)
		if err != nil {
			return err
		}

		// Um período não pode pertencer a duas rodadas (RN23): evita que o
		// mesmo semestre futuro seja planejado em rodadas diferentes.
		var overlap int64
		if err := tx.Model(&models.PlanRound{}).
			Where("period1_semester_id IN ? OR period2_semester_id IN ?",
				[]uint{sem1.ID, sem2.ID}, []uint{sem1.ID, sem2.ID}).
			Count(&overlap).Error; err != nil {
			return err
		}
		if overlap > 0 {
			return Invalid("um dos períodos informados já pertence a outra rodada")
		}

		if err := tx.Model(&models.PlanRound{}).Where("open = ?", true).
			Update("open", false).Error; err != nil {
			return err
		}

		round = models.PlanRound{
			BaseSemesterID:    base.ID,
			Period1SemesterID: sem1.ID,
			Period2SemesterID: sem2.ID,
			Open:              true,
			OpenedByUserID:    userID,
		}
		return tx.Create(&round).Error
	})
	if err != nil {
		return nil, err
	}

	return s.load(round.ID)
}

// Close encerra a rodada, impedindo novos registros/edições de plano
// (RN22: rodada fechada é somente leitura).
func (s *PlanRoundService) Close(id uint) error {
	var round models.PlanRound
	if err := s.db.First(&round, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Rodada não encontrada")
		}
		return err
	}
	return s.db.Model(&round).Update("open", false).Error
}

// Reopen reabre uma rodada encerrada para permitir edições novamente,
// fechando qualquer outra aberta para manter o invariante de uma só (RN19).
func (s *PlanRoundService) Reopen(id uint) (*models.PlanRound, error) {
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var round models.PlanRound
		if err := tx.First(&round, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return NotFound("Rodada não encontrada")
			}
			return err
		}
		if err := tx.Model(&models.PlanRound{}).Where("open = ?", true).
			Update("open", false).Error; err != nil {
			return err
		}
		return tx.Model(&round).Update("open", true).Error
	})
	if err != nil {
		return nil, err
	}
	return s.load(id)
}

// Delete apaga a rodada (em qualquer estado) e os planos registrados nos
// seus dois períodos, em transação. Hard delete para liberar os períodos
// (RN23) e não deixar planos órfãos por semestre. Os semestres-placeholder
// são mantidos — reaproveitados por código em importação futura.
func (s *PlanRoundService) Delete(id uint) error {
	var round models.PlanRound
	if err := s.db.First(&round, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Rodada não encontrada")
		}
		return err
	}

	periods := []uint{round.Period1SemesterID, round.Period2SemesterID}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(
			"DELETE FROM study_plan_disciplines WHERE study_plan_id IN (SELECT id FROM study_plans WHERE semester_id IN ?)",
			periods).Error; err != nil {
			return err
		}
		if err := tx.Unscoped().Where("semester_id IN ?", periods).Delete(&models.StudyPlan{}).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&round).Error
	})
}

// Current devolve a rodada aberta (RN19: no máximo uma).
func (s *PlanRoundService) Current() (*models.PlanRound, error) {
	var round models.PlanRound
	err := s.preloaded().
		Where("open = ?", true).
		Order("id desc").
		First(&round).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Nenhuma rodada de cadastro aberta")
		}
		return nil, err
	}
	return &round, nil
}

// currentOrNil devolve a rodada aberta ou (nil, nil) quando não há —
// usado pela elegibilidade do plano sem tratar "ausência" como erro.
func (s *PlanRoundService) currentOrNil() (*models.PlanRound, error) {
	round, err := s.Current()
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return round, nil
}

func (s *PlanRoundService) Get(id uint) (*models.PlanRound, error) {
	var round models.PlanRound
	if err := s.preloaded().First(&round, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Rodada não encontrada")
		}
		return nil, err
	}
	return &round, nil
}

func (s *PlanRoundService) List() ([]models.PlanRound, error) {
	var rounds []models.PlanRound
	if err := s.preloaded().Order("id desc").Find(&rounds).Error; err != nil {
		return nil, err
	}
	return rounds, nil
}

// Cohort devolve a rodada e os alunos em PAE/PIC no semestre-base dela.
// A lista independe do seletor global — usa o snapshot da rodada.
func (s *PlanRoundService) Cohort(roundID uint) (*models.PlanRound, []CohortStudent, error) {
	round, err := s.Get(roundID)
	if err != nil {
		return nil, nil, err
	}

	var students []CohortStudent
	if err := s.db.Table("academic_records").
		Select("students.registration, students.name, academic_records.status").
		Joins("JOIN students ON students.id = academic_records.student_id").
		Where("academic_records.semester_id = ?", round.BaseSemesterID).
		Where("academic_records.status IN ?", []string{models.StatusPAE, models.StatusPIC}).
		Order("students.name asc").
		Scan(&students).Error; err != nil {
		return nil, nil, err
	}
	return round, students, nil
}

// StudentRounds devolve, para cada rodada em que o aluno esteve em PAE/PIC
// no semestre-base, a rodada + as disciplinas já registradas em cada
// período. Ordena da mais recente para a mais antiga.
func (s *PlanRoundService) StudentRounds(registration string) ([]StudentRoundEntry, error) {
	var student models.Student
	if err := s.db.Where("registration = ?", registration).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Aluno não encontrado")
		}
		return nil, err
	}

	rounds, err := s.List()
	if err != nil {
		return nil, err
	}

	entries := make([]StudentRoundEntry, 0, len(rounds))
	for i := range rounds {
		round := rounds[i]
		status, err := statusInSemester(s.db, student.ID, round.BaseSemesterID)
		if err != nil {
			return nil, err
		}
		if status != models.StatusPAE && status != models.StatusPIC {
			continue
		}

		p1, err := planDisciplines(s.db, student.ID, round.Period1SemesterID)
		if err != nil {
			return nil, err
		}
		p2, err := planDisciplines(s.db, student.ID, round.Period2SemesterID)
		if err != nil {
			return nil, err
		}

		entries = append(entries, StudentRoundEntry{
			Round:              round,
			Status:             status,
			Period1Disciplines: p1,
			Period2Disciplines: p2,
		})
	}
	return entries, nil
}

func (s *PlanRoundService) preloaded() *gorm.DB {
	return s.db.Preload("BaseSemester").Preload("Period1").Preload("Period2")
}

func (s *PlanRoundService) load(id uint) (*models.PlanRound, error) {
	var round models.PlanRound
	if err := s.preloaded().First(&round, id).Error; err != nil {
		return nil, err
	}
	return &round, nil
}

// ensureSemester localiza ou cria o semestre pelo código. Os períodos-alvo
// são futuros e ainda não importados; quando os dados reais chegarem, a
// importação casa pelo mesmo código (FirstOrCreate) — sem duplicação.
func ensureSemester(tx *gorm.DB, code string) (*models.Semester, error) {
	var semester models.Semester
	if err := tx.FirstOrCreate(&semester, models.Semester{Code: code}).Error; err != nil {
		return nil, err
	}
	return &semester, nil
}

// latestDataSemester devolve o semestre de maior código que possui registros
// acadêmicos (o "corrente"); nil se ainda não há dados importados.
func latestDataSemester(db *gorm.DB) (*models.Semester, error) {
	var semester models.Semester
	err := db.Model(&models.Semester{}).
		Joins("JOIN academic_records ar ON ar.semester_id = semesters.id AND ar.deleted_at IS NULL").
		Group("semesters.id").
		Order("semesters.code desc").
		First(&semester).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &semester, nil
}

// statusInSemester devolve o enquadramento do aluno em um semestre
// específico (define o grupo da rodada por semestre-base). "" se não há
// registro.
func statusInSemester(db *gorm.DB, studentID, semesterID uint) (string, error) {
	var record models.AcademicRecord
	err := db.Where("student_id = ? AND semester_id = ?", studentID, semesterID).First(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return record.Status, nil
}

// planDisciplines devolve as disciplinas do plano do aluno naquele semestre
// (nil se não houver plano).
func planDisciplines(db *gorm.DB, studentID, semesterID uint) ([]models.Discipline, error) {
	var plan models.StudyPlan
	err := db.Preload("Disciplines").
		Where("student_id = ? AND semester_id = ?", studentID, semesterID).
		First(&plan).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return plan.Disciplines, nil
}

// isTargetSemester informa se o semestre é um dos dois períodos da rodada.
func isTargetSemester(round *models.PlanRound, semesterID uint) bool {
	return semesterID == round.Period1SemesterID || semesterID == round.Period2SemesterID
}
