package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetStudyPlanHandler(c *gin.Context) {
	registration := c.Param("registration")
	semesterID := c.Query("semester_id")

	if semesterID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester_id é obrigatório"})
		return
	}

	var student models.Student
	if err := database.DB.Where("registration = ?", registration).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	var plan models.StudyPlan
	err := database.DB.
		Preload("Disciplines").
		Preload("Semester").
		Where("student_id = ? AND semester_id = ?", student.ID, semesterID).
		First(&plan).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "plano não encontrado"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar plano"})
		return
	}

	c.JSON(http.StatusOK, plan)
}

func CreateStudyPlanHandler(c *gin.Context) {
	registration := c.Param("registration")

	var body struct {
		SemesterID     uint   `json:"semester_id" binding:"required"`
		DisciplineIDs  []uint `json:"discipline_ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	var student models.Student
	if err := database.DB.Where("registration = ?", registration).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	var record models.AcademicRecord
	if err := database.DB.
		Where("student_id = ? AND semester_id = ?", student.ID, body.SemesterID).
		First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registro acadêmico não encontrado"})
		return
	}

	if record.Status != "PAE" && record.Status != "PIC" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Plano de integralização disponível apenas para alunos em PAE ou PIC"})
		return
	}

	var existing models.StudyPlan
	if err := database.DB.Where("student_id = ? AND semester_id = ?", student.ID, body.SemesterID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Já existe um plano para este aluno e semestre. Use edição para atualizar."})
		return
	}

	plan := models.StudyPlan{
		StudentID:  student.ID,
		SemesterID: body.SemesterID,
	}
	if err := database.DB.Create(&plan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar plano"})
		return
	}

	if len(body.DisciplineIDs) > 0 {
		var disciplines []models.Discipline
		if err := database.DB.Find(&disciplines, body.DisciplineIDs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar disciplinas"})
			return
		}
		if err := database.DB.Model(&plan).Association("Disciplines").Replace(disciplines); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao associar disciplinas"})
			return
		}
	}

	database.DB.Preload("Disciplines").Preload("Semester").First(&plan, plan.ID)
	c.JSON(http.StatusCreated, plan)
}

func UpdateStudyPlanHandler(c *gin.Context) {
	registration := c.Param("registration")

	var body struct {
		SemesterID    uint   `json:"semester_id" binding:"required"`
		DisciplineIDs []uint `json:"discipline_ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	var student models.Student
	if err := database.DB.Where("registration = ?", registration).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	var plan models.StudyPlan
	if err := database.DB.
		Where("student_id = ? AND semester_id = ?", student.ID, body.SemesterID).
		First(&plan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plano não encontrado"})
		return
	}

	var disciplines []models.Discipline
	if len(body.DisciplineIDs) > 0 {
		if err := database.DB.Find(&disciplines, body.DisciplineIDs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar disciplinas"})
			return
		}
	}

	if err := database.DB.Model(&plan).Association("Disciplines").Replace(disciplines); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar disciplinas"})
		return
	}

	database.DB.Preload("Disciplines").Preload("Semester").First(&plan, plan.ID)
	c.JSON(http.StatusOK, plan)
}
