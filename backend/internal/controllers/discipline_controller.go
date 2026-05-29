package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetDisciplinesHandler(c *gin.Context) {
	var disciplines []models.Discipline
	if err := database.DB.Order("name asc").Find(&disciplines).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar disciplinas"})
		return
	}
	c.JSON(http.StatusOK, disciplines)
}

func CreateDisciplineHandler(c *gin.Context) {
	var body struct {
		Code string `json:"code" binding:"required"`
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	var existing models.Discipline
	if err := database.DB.Where("code = ?", body.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Código de disciplina já cadastrado"})
		return
	}

	discipline := models.Discipline{Code: body.Code, Name: body.Name}
	if err := database.DB.Create(&discipline).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar disciplina"})
		return
	}
	c.JSON(http.StatusCreated, discipline)
}

func UpdateDisciplineHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var discipline models.Discipline
	if err := database.DB.First(&discipline, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Disciplina não encontrada"})
		return
	}

	var body struct {
		Code *string `json:"code"`
		Name *string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if body.Code != nil {
		updates["code"] = *body.Code
	}
	if body.Name != nil {
		updates["name"] = *body.Name
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum campo fornecido para atualização"})
		return
	}

	if err := database.DB.Model(&discipline).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar disciplina"})
		return
	}
	c.JSON(http.StatusOK, discipline)
}

func DeleteDisciplineHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var discipline models.Discipline
	if err := database.DB.First(&discipline, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Disciplina não encontrada"})
		return
	}

	if err := database.DB.Delete(&discipline).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover disciplina"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Disciplina removida com sucesso"})
}
