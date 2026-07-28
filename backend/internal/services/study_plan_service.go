package services

import (
	"errors"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type StudyPlanService struct {
	db     *gorm.DB
	rounds *PlanRoundService
}

func NewStudyPlanService(db *gorm.DB, rounds *PlanRoundService) *StudyPlanService {
	return &StudyPlanService{db: db, rounds: rounds}
}

// ensureEligible aplica a elegibilidade do plano por rodada: precisa haver
// rodada aberta (RN17/RN19), o semestre precisa ser um dos períodos-alvo
// dela, e o enquadramento mais recente do aluno precisa ser PAE ou PIC
// (RN18) — como os períodos-alvo são futuros, a elegibilidade não vem do
// registro do semestre-alvo. Vale para aluno (self) e coordenador (fallback).
func (s *StudyPlanService) ensureEligible(studentID, semesterID uint) error {
	round, err := s.rounds.currentOrNil()
	if err != nil {
		return err
	}
	if round == nil {
		return Forbidden("Não há rodada de cadastro de plano aberta")
	}
	if !isTargetSemester(round, semesterID) {
		return Invalid("o semestre informado não faz parte da rodada atual")
	}

	status, err := latestStatus(s.db, studentID)
	if err != nil {
		return err
	}
	if status != models.StatusPAE && status != models.StatusPIC {
		return Forbidden("Plano de integralização disponível apenas para alunos em PAE ou PIC")
	}
	return nil
}

func (s *StudyPlanService) findStudent(registration string) (*models.Student, error) {
	var student models.Student
	if err := s.db.Where("registration = ?", registration).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Aluno não encontrado")
		}
		return nil, err
	}
	return &student, nil
}

func (s *StudyPlanService) load(planID uint) (*models.StudyPlan, error) {
	var plan models.StudyPlan
	if err := s.db.Preload("Disciplines").Preload("Semester").First(&plan, planID).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (s *StudyPlanService) Get(registration, semesterID string) (*models.StudyPlan, error) {
	if semesterID == "" {
		return nil, Invalid("semester_id é obrigatório")
	}

	student, err := s.findStudent(registration)
	if err != nil {
		return nil, err
	}

	var plan models.StudyPlan
	if err := s.db.Preload("Disciplines").Preload("Semester").
		Where("student_id = ? AND semester_id = ?", student.ID, semesterID).
		First(&plan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("plano não encontrado")
		}
		return nil, err
	}
	return &plan, nil
}

// Create registra o plano de integralização de um aluno em PAE ou PIC
// (RN09). A unicidade por aluno e semestre (RN10) é garantida pelo
// índice único do banco; plano e disciplinas entram na mesma transação.
func (s *StudyPlanService) Create(registration string, semesterID uint, disciplineIDs []uint) (*models.StudyPlan, error) {
	student, err := s.findStudent(registration)
	if err != nil {
		return nil, err
	}

	if err := s.ensureEligible(student.ID, semesterID); err != nil {
		return nil, err
	}

	plan := models.StudyPlan{StudentID: student.ID, SemesterID: semesterID}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&plan).Error; err != nil {
			if isUniqueViolation(err) {
				return Conflict("Já existe um plano para este aluno e semestre. Use edição para atualizar.")
			}
			return err
		}
		return replaceDisciplines(tx, &plan, disciplineIDs)
	})
	if err != nil {
		return nil, err
	}

	return s.load(plan.ID)
}

// Update substitui integralmente a lista de disciplinas do plano (RN11).
func (s *StudyPlanService) Update(registration string, semesterID uint, disciplineIDs []uint) (*models.StudyPlan, error) {
	student, err := s.findStudent(registration)
	if err != nil {
		return nil, err
	}

	if err := s.ensureEligible(student.ID, semesterID); err != nil {
		return nil, err
	}

	var plan models.StudyPlan
	if err := s.db.
		Where("student_id = ? AND semester_id = ?", student.ID, semesterID).
		First(&plan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Plano não encontrado")
		}
		return nil, err
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		return replaceDisciplines(tx, &plan, disciplineIDs)
	}); err != nil {
		return nil, err
	}

	return s.load(plan.ID)
}

func replaceDisciplines(tx *gorm.DB, plan *models.StudyPlan, ids []uint) error {
	var disciplines []models.Discipline
	if len(ids) > 0 {
		if err := tx.Find(&disciplines, ids).Error; err != nil {
			return err
		}
		if len(disciplines) != len(ids) {
			return Invalid("uma ou mais disciplinas informadas não existem")
		}
	}
	return tx.Model(plan).Association("Disciplines").Replace(disciplines)
}
