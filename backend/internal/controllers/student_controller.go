package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Retorna o perfil do aluno e todo seu histórico acadêmico ordenado
func GetStudentHistoryHandler(c *gin.Context) {
	registration := c.Param("registration") // Vamos buscar pela MATRÍCULA, que é mais fácil de ler na URL

	var student models.Student

	// 1. Busca o Aluno e o Curso
	if result := database.DB.
		Preload("Course").
		Where("registration = ?", registration).
		First(&student); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	// 2. Busca o Histórico (Records + Semestres)
	var records []models.AcademicRecord
	if result := database.DB.
		Preload("Semester").
		Where("student_id = ?", student.ID).
		Joins("JOIN semesters ON semesters.id = academic_records.semester_id").
		Order("semesters.code asc"). // Ordena cronologicamente (2025/1 -> 2025/2)
		Find(&records); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar histórico"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student": student,
		"history": records,
	})
}
