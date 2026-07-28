package services

import (
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// newTestDB abre um SQLite in-memory (puro Go, sem CGO) migrado com o
// esquema real. Cada teste recebe um banco isolado.
func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("abrir sqlite: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.Semester{},
		&models.Student{},
		&models.AcademicRecord{},
		&models.StudentAction{},
		&models.Discipline{},
		&models.StudyPlan{},
		&models.PlanRound{},
	); err != nil {
		t.Fatalf("migração: %v", err)
	}
	return db
}

// seedStudentWithStatus cria um aluno e um registro acadêmico no semestre
// informado (criado se necessário), com o enquadramento dado.
func seedStudentWithStatus(t *testing.T, db *gorm.DB, registration, semesterCode, status string) *models.Student {
	t.Helper()

	course := models.Course{Code: 1, Name: "Curso Teste"}
	if err := db.FirstOrCreate(&course, models.Course{Code: 1}).Error; err != nil {
		t.Fatalf("seed course: %v", err)
	}

	var semester models.Semester
	if err := db.FirstOrCreate(&semester, models.Semester{Code: semesterCode}).Error; err != nil {
		t.Fatalf("seed semester: %v", err)
	}

	student := models.Student{Registration: registration, Name: "Aluno " + registration, CourseID: course.ID}
	if err := db.Create(&student).Error; err != nil {
		t.Fatalf("seed student: %v", err)
	}

	record := models.AcademicRecord{StudentID: student.ID, SemesterID: semester.ID, Status: status}
	if err := db.Create(&record).Error; err != nil {
		t.Fatalf("seed record: %v", err)
	}
	return &student
}
