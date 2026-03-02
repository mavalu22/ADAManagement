package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetStudentHistoryHandler(c *gin.Context) {
	registration := c.Param("registration")

	var student models.Student

	if result := database.DB.
		Preload("Course").
		Where("registration = ?", registration).
		First(&student); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	var records []models.AcademicRecord
	if result := database.DB.
		Preload("Semester").
		Where("student_id = ?", student.ID).
		Joins("JOIN semesters ON semesters.id = academic_records.semester_id").
		Order("semesters.code asc").
		Find(&records); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar histórico"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student": student,
		"history": records,
	})
}
