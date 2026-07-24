package services

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// MaxActionDescription limita a descrição das ações de acompanhamento (RN12).
const MaxActionDescription = 500

type ActionService struct {
	db *gorm.DB
}

func NewActionService(db *gorm.DB) *ActionService { return &ActionService{db: db} }

func (s *ActionService) findStudent(registration string) (*models.Student, error) {
	var student models.Student
	if err := s.db.Where("registration = ?", registration).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Aluno não encontrado")
		}
		return nil, err
	}
	return &student, nil
}

func (s *ActionService) List(registration, semesterID string) ([]models.StudentAction, error) {
	if semesterID == "" {
		return nil, Invalid("semester_id é obrigatório")
	}

	student, err := s.findStudent(registration)
	if err != nil {
		return nil, err
	}

	var actions []models.StudentAction
	if err := s.db.
		Where("student_id = ? AND semester_id = ?", student.ID, semesterID).
		Order("action_date DESC").
		Find(&actions).Error; err != nil {
		return nil, err
	}
	return actions, nil
}

type ActionInput struct {
	SemesterID   uint
	ActionDate   time.Time
	Description  string
	ResponseDate *time.Time
}

// Create registra uma ação de acompanhamento. Alunos em regularidade não
// admitem novas ações (RN05).
func (s *ActionService) Create(registration string, in ActionInput) (*models.StudentAction, error) {
	if len(in.Description) > MaxActionDescription {
		return nil, Invalid("Descrição deve ter no máximo 500 caracteres")
	}

	student, err := s.findStudent(registration)
	if err != nil {
		return nil, err
	}

	var record models.AcademicRecord
	if err := s.db.
		Where("student_id = ? AND semester_id = ?", student.ID, in.SemesterID).
		First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Registro acadêmico não encontrado para este aluno e semestre")
		}
		return nil, err
	}

	if record.Status == models.StatusRegular {
		return nil, Forbidden("Não é possível registrar ações para alunos em situação regular")
	}

	action := models.StudentAction{
		StudentID:    student.ID,
		SemesterID:   in.SemesterID,
		ActionDate:   in.ActionDate,
		Description:  in.Description,
		ResponseDate: in.ResponseDate,
	}
	if err := s.db.Create(&action).Error; err != nil {
		return nil, err
	}
	return &action, nil
}

type ActionUpdateInput struct {
	ActionDate   *time.Time
	Description  *string
	ResponseDate *time.Time
}

func (s *ActionService) Update(id uint, in ActionUpdateInput) (*models.StudentAction, error) {
	var action models.StudentAction
	if err := s.db.First(&action, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Ação não encontrada")
		}
		return nil, err
	}

	updates := map[string]any{}
	if in.ActionDate != nil {
		updates["action_date"] = in.ActionDate
	}
	if in.Description != nil {
		if len(*in.Description) > MaxActionDescription {
			return nil, Invalid("Descrição deve ter no máximo 500 caracteres")
		}
		updates["description"] = in.Description
	}
	if in.ResponseDate != nil {
		updates["response_date"] = in.ResponseDate
	}
	if len(updates) == 0 {
		return nil, Invalid("Nenhum campo fornecido para atualização")
	}

	if err := s.db.Model(&action).Updates(updates).Error; err != nil {
		return nil, err
	}
	return &action, nil
}

func (s *ActionService) Delete(id uint) error {
	var action models.StudentAction
	if err := s.db.First(&action, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Ação não encontrada")
		}
		return err
	}
	return s.db.Delete(&action).Error
}
