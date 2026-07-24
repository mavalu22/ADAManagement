package services

import (
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type ReportService struct {
	db *gorm.DB
}

func NewReportService(db *gorm.DB) *ReportService { return &ReportService{db: db} }

func (s *ReportService) Semesters() ([]models.Semester, error) {
	var semesters []models.Semester
	if err := s.db.Order("code desc").Find(&semesters).Error; err != nil {
		return nil, err
	}
	return semesters, nil
}

type RecordsFilter struct {
	SemesterID   string
	Registration string
	StudentName  string
	CourseName   string
	Status       string
	CriticalOnly bool
	MaxPending   *int
	Limit        int
	Offset       int
}

// Records retorna o relatório acadêmico. Quando Limit > 0 a consulta é
// paginada e o total de registros é calculado; caso contrário total é -1.
func (s *ReportService) Records(f RecordsFilter) ([]models.AcademicRecord, int64, error) {
	q := s.db.Model(&models.AcademicRecord{}).
		Joins("JOIN students ON students.id = academic_records.student_id").
		Joins("JOIN courses ON courses.id = students.course_id").
		Preload("Student").
		Preload("Student.Course").
		Preload("Semester")

	if f.SemesterID != "" {
		q = q.Where("academic_records.semester_id = ?", f.SemesterID)
	}
	if f.CriticalOnly {
		q = criticalScope(q)
	}
	if f.MaxPending != nil {
		q = nearGraduationScope(q, *f.MaxPending).
			Order("academic_records.pending_obligatory ASC")
	}
	if f.Registration != "" {
		q = q.Where("students.registration LIKE ?", "%"+f.Registration+"%")
	}
	if f.StudentName != "" {
		q = q.Where("students.name LIKE ?", "%"+f.StudentName+"%")
	}
	if f.CourseName != "" {
		q = q.Where("courses.name LIKE ?", "%"+f.CourseName+"%")
	}
	if f.Status != "" {
		q = q.Where("academic_records.status = ?", f.Status)
	}

	total := int64(-1)
	if f.Limit > 0 {
		if err := q.Session(&gorm.Session{}).Count(&total).Error; err != nil {
			return nil, 0, err
		}
		q = q.Limit(f.Limit).Offset(f.Offset)
	}

	var records []models.AcademicRecord
	if err := q.Find(&records).Error; err != nil {
		return nil, 0, err
	}
	return records, total, nil
}

type CoursesFilter struct {
	Code *int
	Name string
}

func (s *ReportService) Courses(f CoursesFilter) ([]models.Course, error) {
	q := s.db.Model(&models.Course{})
	if f.Code != nil {
		q = q.Where("code = ?", *f.Code)
	}
	if f.Name != "" {
		q = q.Where("name LIKE ?", "%"+f.Name+"%")
	}

	var courses []models.Course
	if err := q.Find(&courses).Error; err != nil {
		return nil, err
	}
	return courses, nil
}

type StudentsFilter struct {
	SemesterID   string
	Registration string
	Name         string
	EntryYear    *int
	QuotaType    string
	Limit        int
	Offset       int
}

// Students lista a base de alunos; com SemesterID, restringe aos que têm
// registro acadêmico no semestre. O índice único (student, semester)
// garante no máximo uma linha por aluno no join — não há duplicação.
func (s *ReportService) Students(f StudentsFilter) ([]models.Student, int64, error) {
	q := s.db.Model(&models.Student{}).Preload("Course")

	if f.SemesterID != "" {
		q = q.Joins("JOIN academic_records ON academic_records.student_id = students.id AND academic_records.deleted_at IS NULL").
			Where("academic_records.semester_id = ?", f.SemesterID)
	}
	if f.Registration != "" {
		q = q.Where("students.registration LIKE ?", "%"+f.Registration+"%")
	}
	if f.Name != "" {
		q = q.Where("students.name LIKE ?", "%"+f.Name+"%")
	}
	if f.EntryYear != nil {
		q = q.Where("students.entry_year = ?", *f.EntryYear)
	}
	if f.QuotaType != "" {
		q = q.Where("students.quota_type = ?", f.QuotaType)
	}

	total := int64(-1)
	if f.Limit > 0 {
		if err := q.Session(&gorm.Session{}).Count(&total).Error; err != nil {
			return nil, 0, err
		}
		q = q.Limit(f.Limit).Offset(f.Offset)
	}

	var students []models.Student
	if err := q.Find(&students).Error; err != nil {
		return nil, 0, err
	}
	return students, total, nil
}
