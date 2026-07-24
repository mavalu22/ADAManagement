package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/services"
)

type StudyPlanHandler struct {
	svc *services.StudyPlanService
}

func NewStudyPlanHandler(svc *services.StudyPlanService) *StudyPlanHandler {
	return &StudyPlanHandler{svc: svc}
}

func (h *StudyPlanHandler) Get(c *gin.Context) {
	plan, err := h.svc.Get(c.Param("registration"), c.Query("semester_id"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewStudyPlan(*plan))
}

type studyPlanInput struct {
	SemesterID    uint   `json:"semester_id" binding:"required"`
	DisciplineIDs []uint `json:"discipline_ids"`
}

func (h *StudyPlanHandler) Create(c *gin.Context) {
	var in studyPlanInput
	if !bindJSON(c, &in) {
		return
	}

	plan, err := h.svc.Create(c.Param("registration"), in.SemesterID, in.DisciplineIDs)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.NewStudyPlan(*plan))
}

func (h *StudyPlanHandler) Update(c *gin.Context) {
	var in studyPlanInput
	if !bindJSON(c, &in) {
		return
	}

	plan, err := h.svc.Update(c.Param("registration"), in.SemesterID, in.DisciplineIDs)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewStudyPlan(*plan))
}
