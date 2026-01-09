package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 1. Listar todos os semestres (Para o Dropdown do Header)
func GetSemestersHandler(c *gin.Context) {
	var semesters []models.Semester
	// Ordena do mais recente para o mais antigo
	if result := database.DB.Order("code desc").Find(&semesters); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar semestres"})
		return
	}
	c.JSON(http.StatusOK, semesters)
}

// 2. Relatório de Registros Acadêmicos (Filtrado por Semestre)
func GetAcademicRecordsReportHandler(c *gin.Context) {
	semesterID := c.Query("semester_id")
	if semesterID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester_id é obrigatório"})
		return
	}

	var records []models.AcademicRecord
	// Preload carrega os dados do Aluno e do Curso associado ao Aluno
	if result := database.DB.
		Preload("Student").
		Preload("Student.Course").
		Preload("Semester").
		Where("semester_id = ?", semesterID).
		Find(&records); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar relatório"})
		return
	}
	c.JSON(http.StatusOK, records)
}

// 3. Relatório de Cursos (Resumo por Semestre)
func GetCoursesReportHandler(c *gin.Context) {
	// Retorna todos os cursos cadastrados
	var courses []models.Course
	if result := database.DB.Find(&courses); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar cursos"})
		return
	}
	c.JSON(http.StatusOK, courses)
}

// 4. Relatório de Alunos (Filtrado por Semestre - Alunos ativos naquele semestre)
func GetStudentsReportHandler(c *gin.Context) {
	semesterID := c.Query("semester_id")

	var students []models.Student

	// Busca alunos que tenham ALGUM registro no semestre selecionado
	// Join é mais performático que subquery aqui
	if result := database.DB.
		Joins("JOIN academic_records ON academic_records.student_id = students.id").
		Preload("Course"). // Traz o curso do aluno
		Where("academic_records.semester_id = ?", semesterID).
		Find(&students); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar alunos"})
		return
	}

	c.JSON(http.StatusOK, students)
}
