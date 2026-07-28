package services

import (
	"errors"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type StudentService struct {
	db *gorm.DB
}

func NewStudentService(db *gorm.DB) *StudentService { return &StudentService{db: db} }

// History retorna o aluno e seus registros acadêmicos ordenados por
// semestre (visão longitudinal do histórico individual).
func (s *StudentService) History(registration string) (*models.Student, []models.AcademicRecord, error) {
	var student models.Student
	if err := s.db.Preload("Course").Where("registration = ?", registration).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, NotFound("Aluno não encontrado")
		}
		return nil, nil, err
	}

	var records []models.AcademicRecord
	if err := s.db.Preload("Semester").
		Joins("JOIN semesters ON semesters.id = academic_records.semester_id").
		Where("student_id = ?", student.ID).
		Order("semesters.code asc").
		Find(&records).Error; err != nil {
		return nil, nil, err
	}

	return &student, records, nil
}

// latestStatus devolve o enquadramento do aluno no semestre mais recente
// (maior código). Base da elegibilidade PAE/PIC quando o plano mira
// períodos futuros ainda não importados (RN18). Retorna "" se o aluno não
// tem registro acadêmico. Função de pacote, compartilhada entre services.
func latestStatus(db *gorm.DB, studentID uint) (string, error) {
	var record models.AcademicRecord
	err := db.
		Joins("JOIN semesters ON semesters.id = academic_records.semester_id").
		Where("academic_records.student_id = ?", studentID).
		Order("semesters.code desc").
		First(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return record.Status, nil
}
