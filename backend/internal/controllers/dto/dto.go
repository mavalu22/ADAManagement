// Package dto define os contratos de resposta da API. Os models GORM não
// são serializados diretamente: o contrato fica estável (e sem campos
// internos, como deleted_at) mesmo quando o esquema do banco evolui.
//
// A capitalização das chaves preserva o contrato já consumido pelo
// frontend: "ID" (herdada do gorm.Model) e demais campos em snake_case.
package dto

import (
	"time"

	"adamanagement/backend/internal/models"
)

type Semester struct {
	ID   uint   `json:"ID"`
	Code string `json:"code"`
}

func NewSemester(m models.Semester) Semester {
	return Semester{ID: m.ID, Code: m.Code}
}

func NewSemesters(ms []models.Semester) []Semester {
	out := make([]Semester, len(ms))
	for i, m := range ms {
		out[i] = NewSemester(m)
	}
	return out
}

type Course struct {
	ID          uint   `json:"ID"`
	Code        int    `json:"code"`
	Name        string `json:"name"`
	Coordinator string `json:"coordinator"`
}

func NewCourse(m models.Course) Course {
	return Course{ID: m.ID, Code: m.Code, Name: m.Name, Coordinator: m.Coordinator}
}

func NewCourses(ms []models.Course) []Course {
	out := make([]Course, len(ms))
	for i, m := range ms {
		out[i] = NewCourse(m)
	}
	return out
}

type Discipline struct {
	ID   uint   `json:"ID"`
	Code string `json:"code"`
	Name string `json:"name"`
}

func NewDiscipline(m models.Discipline) Discipline {
	return Discipline{ID: m.ID, Code: m.Code, Name: m.Name}
}

func NewDisciplines(ms []models.Discipline) []Discipline {
	out := make([]Discipline, len(ms))
	for i, m := range ms {
		out[i] = NewDiscipline(m)
	}
	return out
}

type User struct {
	ID    uint   `json:"ID"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func NewUser(m models.User) User {
	return User{ID: m.ID, Name: m.Name, Email: m.Email, Role: m.Role}
}

func NewUsers(ms []models.User) []User {
	out := make([]User, len(ms))
	for i, m := range ms {
		out[i] = NewUser(m)
	}
	return out
}

type Student struct {
	ID           uint    `json:"ID"`
	Registration string  `json:"registration"`
	Name         string  `json:"name"`
	EntryYear    int     `json:"entry_year"`
	EntryPeriod  string  `json:"entry_period"`
	QuotaType    string  `json:"quota_type"`
	Course       *Course `json:"course,omitempty"`
}

func NewStudent(m models.Student) Student {
	s := Student{
		ID:           m.ID,
		Registration: m.Registration,
		Name:         m.Name,
		EntryYear:    m.EntryYear,
		EntryPeriod:  m.EntryPeriod,
		QuotaType:    m.QuotaType,
	}
	if m.Course.ID != 0 {
		course := NewCourse(m.Course)
		s.Course = &course
	}
	return s
}

func NewStudents(ms []models.Student) []Student {
	out := make([]Student, len(ms))
	for i, m := range ms {
		out[i] = NewStudent(m)
	}
	return out
}

type AcademicRecord struct {
	ID                uint      `json:"ID"`
	StudentID         uint      `json:"student_id"`
	SemesterID        uint      `json:"semester_id"`
	Status            string    `json:"status"`
	StatusDetail      string    `json:"status_detail"`
	IntegralizedHours int       `json:"integralized_hours"`
	TotalHours        int       `json:"total_hours"`
	PendingObligatory int       `json:"pending_obligatory"`
	SemestersNoHours  int       `json:"semesters_no_hours"`
	Locks             int       `json:"locks"`
	Student           *Student  `json:"student,omitempty"`
	Semester          *Semester `json:"semester,omitempty"`
}

// NewAcademicRecord inclui aluno e semestre apenas quando pré-carregados.
func NewAcademicRecord(m models.AcademicRecord) AcademicRecord {
	r := AcademicRecord{
		ID:                m.ID,
		StudentID:         m.StudentID,
		SemesterID:        m.SemesterID,
		Status:            m.Status,
		StatusDetail:      m.StatusDetail,
		IntegralizedHours: m.IntegralizedHours,
		TotalHours:        m.TotalHours,
		PendingObligatory: m.PendingObligatory,
		SemestersNoHours:  m.SemestersNoHours,
		Locks:             m.Locks,
	}
	if m.Student.ID != 0 {
		student := NewStudent(m.Student)
		r.Student = &student
	}
	if m.Semester.ID != 0 {
		semester := NewSemester(m.Semester)
		r.Semester = &semester
	}
	return r
}

func NewAcademicRecords(ms []models.AcademicRecord) []AcademicRecord {
	out := make([]AcademicRecord, len(ms))
	for i, m := range ms {
		out[i] = NewAcademicRecord(m)
	}
	return out
}

type StudentAction struct {
	ID           uint       `json:"ID"`
	StudentID    uint       `json:"student_id"`
	SemesterID   uint       `json:"semester_id"`
	ActionDate   time.Time  `json:"action_date"`
	Description  string     `json:"description"`
	ResponseDate *time.Time `json:"response_date"`
}

func NewStudentAction(m models.StudentAction) StudentAction {
	return StudentAction{
		ID:           m.ID,
		StudentID:    m.StudentID,
		SemesterID:   m.SemesterID,
		ActionDate:   m.ActionDate,
		Description:  m.Description,
		ResponseDate: m.ResponseDate,
	}
}

func NewStudentActions(ms []models.StudentAction) []StudentAction {
	out := make([]StudentAction, len(ms))
	for i, m := range ms {
		out[i] = NewStudentAction(m)
	}
	return out
}

type StudyPlan struct {
	ID          uint         `json:"ID"`
	StudentID   uint         `json:"student_id"`
	SemesterID  uint         `json:"semester_id"`
	Semester    *Semester    `json:"semester,omitempty"`
	Disciplines []Discipline `json:"disciplines"`
}

func NewStudyPlan(m models.StudyPlan) StudyPlan {
	p := StudyPlan{
		ID:          m.ID,
		StudentID:   m.StudentID,
		SemesterID:  m.SemesterID,
		Disciplines: NewDisciplines(m.Disciplines),
	}
	if m.Semester.ID != 0 {
		semester := NewSemester(m.Semester)
		p.Semester = &semester
	}
	return p
}
