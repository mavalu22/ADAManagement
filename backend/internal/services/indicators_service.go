package services

import (
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// NearGraduationMaxPending é o limite de disciplinas obrigatórias
// pendentes usado no painel de indicadores (RN03).
const NearGraduationMaxPending = 6

type IndicatorsService struct {
	db *gorm.DB
}

func NewIndicatorsService(db *gorm.DB) *IndicatorsService { return &IndicatorsService{db: db} }

// Os tipos abaixo são modelos de leitura do painel; as tags JSON definem
// o contrato consumido pelo frontend.
type DashboardData struct {
	StatusDistribution     []ChartData             `json:"status_distribution"`
	CriticalStudents       []CriticalStudent       `json:"critical_students"`
	NearGraduationStudents []NearGraduationStudent `json:"near_graduation_students"`
}

type ChartData struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Extra string  `json:"extra,omitempty"`
}

type CriticalStudent struct {
	ID           uint   `json:"id"`
	Registration string `json:"registration"`
	Name         string `json:"name"`
	Locks        int    `json:"locks"`
	NoHours      int    `json:"no_hours"`
}

type NearGraduationStudent struct {
	ID                uint   `json:"id"`
	Registration      string `json:"registration"`
	Name              string `json:"name"`
	Course            string `json:"course"`
	PendingObligatory int    `json:"pending_obligatory"`
}

func (s *IndicatorsService) Dashboard(semesterID string) (*DashboardData, error) {
	if semesterID == "" {
		return nil, Invalid("semester_id é obrigatório")
	}

	var dashboard DashboardData

	if err := s.db.Model(&models.AcademicRecord{}).
		Select("status as name, COUNT(id) as value").
		Where("semester_id = ?", semesterID).
		Group("status").
		Scan(&dashboard.StatusDistribution).Error; err != nil {
		return nil, err
	}

	critical := s.db.Table("academic_records").
		Select("students.id, students.registration, students.name, academic_records.locks, academic_records.semesters_no_hours as no_hours").
		Joins("JOIN students ON students.id = academic_records.student_id").
		Where("academic_records.semester_id = ?", semesterID).
		Where("academic_records.deleted_at IS NULL")
	if err := criticalScope(critical).
		Order("academic_records.locks DESC, academic_records.semesters_no_hours DESC").
		Scan(&dashboard.CriticalStudents).Error; err != nil {
		return nil, err
	}

	near := s.db.Table("academic_records").
		Select("students.id, students.registration, students.name, courses.name as course, academic_records.pending_obligatory").
		Joins("JOIN students ON students.id = academic_records.student_id").
		Joins("JOIN courses ON courses.id = students.course_id").
		Where("academic_records.semester_id = ?", semesterID).
		Where("academic_records.deleted_at IS NULL")
	if err := nearGraduationScope(near, NearGraduationMaxPending).
		Order("academic_records.pending_obligatory ASC").
		Scan(&dashboard.NearGraduationStudents).Error; err != nil {
		return nil, err
	}

	return &dashboard, nil
}
