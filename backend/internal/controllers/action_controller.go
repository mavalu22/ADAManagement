package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/services"
)

type ActionHandler struct {
	svc *services.ActionService
}

func NewActionHandler(svc *services.ActionService) *ActionHandler { return &ActionHandler{svc: svc} }

func (h *ActionHandler) List(c *gin.Context) {
	actions, err := h.svc.List(c.Param("registration"), c.Query("semester_id"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewStudentActions(actions))
}

type actionCreateInput struct {
	SemesterID   uint       `json:"semester_id" binding:"required"`
	ActionDate   time.Time  `json:"action_date" binding:"required"`
	Description  string     `json:"description" binding:"required"`
	ResponseDate *time.Time `json:"response_date"`
}

func (h *ActionHandler) Create(c *gin.Context) {
	var in actionCreateInput
	if !bindJSON(c, &in) {
		return
	}

	action, err := h.svc.Create(c.Param("registration"), services.ActionInput{
		SemesterID:   in.SemesterID,
		ActionDate:   in.ActionDate,
		Description:  in.Description,
		ResponseDate: in.ResponseDate,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.NewStudentAction(*action))
}

type actionUpdateInput struct {
	ActionDate   *time.Time `json:"action_date"`
	Description  *string    `json:"description"`
	ResponseDate *time.Time `json:"response_date"`
}

func (h *ActionHandler) Update(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}

	var in actionUpdateInput
	if !bindJSON(c, &in) {
		return
	}

	action, err := h.svc.Update(id, services.ActionUpdateInput{
		ActionDate:   in.ActionDate,
		Description:  in.Description,
		ResponseDate: in.ResponseDate,
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewStudentAction(*action))
}

func (h *ActionHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(id); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Ação removida com sucesso"})
}
