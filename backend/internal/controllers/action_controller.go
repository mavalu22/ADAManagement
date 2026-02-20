package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GET /api/students/:registration/actions?semester_id=X
// Lista todas as ações registradas para um aluno em um semestre, ordenadas por data DESC
func GetStudentActionsHandler(c *gin.Context) {
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

	var actions []models.StudentAction
	if err := database.DB.
		Where("student_id = ? AND semester_id = ?", student.ID, semesterID).
		Order("action_date DESC").
		Find(&actions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar ações"})
		return
	}

	c.JSON(http.StatusOK, actions)
}

// POST /api/students/:registration/actions
// Registra uma nova ação para um aluno em um semestre
// Regra de negócio: bloqueado para alunos com status "Em regularidade"
func CreateStudentActionHandler(c *gin.Context) {
	registration := c.Param("registration")

	var body struct {
		SemesterID   uint       `json:"semester_id" binding:"required"`
		ActionDate   time.Time  `json:"action_date" binding:"required"`
		Description  string     `json:"description" binding:"required"`
		ResponseDate *time.Time `json:"response_date"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if len(body.Description) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Descrição deve ter no máximo 500 caracteres"})
		return
	}

	var student models.Student
	if err := database.DB.Where("registration = ?", registration).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aluno não encontrado"})
		return
	}

	// Validar situação acadêmica do aluno no semestre
	var record models.AcademicRecord
	if err := database.DB.
		Where("student_id = ? AND semester_id = ?", student.ID, body.SemesterID).
		First(&record).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registro acadêmico não encontrado para este aluno e semestre"})
		return
	}

	// Regra de negócio: não permite ação para aluno em regularidade
	if record.Status == "Em regularidade" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Não é possível registrar ações para alunos em situação regular"})
		return
	}

	action := models.StudentAction{
		StudentID:    student.ID,
		SemesterID:   body.SemesterID,
		ActionDate:   body.ActionDate,
		Description:  body.Description,
		ResponseDate: body.ResponseDate,
	}

	if err := database.DB.Create(&action).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar ação"})
		return
	}

	c.JSON(http.StatusCreated, action)
}

// PUT /api/actions/:id
// Atualiza uma ação existente (parcial: apenas os campos enviados são alterados)
func UpdateStudentActionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var action models.StudentAction
	if err := database.DB.First(&action, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ação não encontrada"})
		return
	}

	var body struct {
		ActionDate   *time.Time `json:"action_date"`
		Description  *string    `json:"description"`
		ResponseDate *time.Time `json:"response_date"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	// Atualização parcial: apenas altera o que foi enviado
	updates := map[string]interface{}{}

	if body.ActionDate != nil {
		updates["action_date"] = body.ActionDate
	}
	if body.Description != nil {
		if len(*body.Description) > 500 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Descrição deve ter no máximo 500 caracteres"})
			return
		}
		updates["description"] = body.Description
	}
	if body.ResponseDate != nil {
		updates["response_date"] = body.ResponseDate
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo fornecido para atualização"})
		return
	}

	if err := database.DB.Model(&action).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar ação"})
		return
	}

	c.JSON(http.StatusOK, action)
}

// DELETE /api/actions/:id
// Remove (soft delete) uma ação registrada
func DeleteStudentActionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var action models.StudentAction
	if err := database.DB.First(&action, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ação não encontrada"})
		return
	}

	if err := database.DB.Delete(&action).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar ação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ação removida com sucesso"})
}
