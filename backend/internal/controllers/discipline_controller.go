package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/services"
)

type DisciplineHandler struct {
	svc *services.DisciplineService
}

func NewDisciplineHandler(svc *services.DisciplineService) *DisciplineHandler {
	return &DisciplineHandler{svc: svc}
}

func (h *DisciplineHandler) List(c *gin.Context) {
	disciplines, err := h.svc.List()
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewDisciplines(disciplines))
}

type disciplineCreateInput struct {
	Code string `json:"code" binding:"required"`
	Name string `json:"name" binding:"required"`
}

func (h *DisciplineHandler) Create(c *gin.Context) {
	var in disciplineCreateInput
	if !bindJSON(c, &in) {
		return
	}

	discipline, err := h.svc.Create(in.Code, in.Name)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.NewDiscipline(*discipline))
}

type disciplineUpdateInput struct {
	Code *string `json:"code"`
	Name *string `json:"name"`
}

func (h *DisciplineHandler) Update(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}

	var in disciplineUpdateInput
	if !bindJSON(c, &in) {
		return
	}

	discipline, err := h.svc.Update(id, in.Code, in.Name)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewDiscipline(*discipline))
}

func (h *DisciplineHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(id); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Disciplina removida com sucesso"})
}
