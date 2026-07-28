package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/middlewares"
	"adamanagement/backend/internal/services"
)

type PlanRoundHandler struct {
	svc *services.PlanRoundService
}

func NewPlanRoundHandler(svc *services.PlanRoundService) *PlanRoundHandler {
	return &PlanRoundHandler{svc: svc}
}

type openRoundInput struct {
	Period1 string `json:"period1" binding:"required"`
	Period2 string `json:"period2" binding:"required"`
}

func (h *PlanRoundHandler) Open(c *gin.Context) {
	var in openRoundInput
	if !bindJSON(c, &in) {
		return
	}

	userID, _ := middlewares.UserID(c)
	round, err := h.svc.Open(in.Period1, in.Period2, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.NewPlanRound(*round))
}

func (h *PlanRoundHandler) Close(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}
	if err := h.svc.Close(id); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Rodada encerrada"})
}

func (h *PlanRoundHandler) Current(c *gin.Context) {
	round, err := h.svc.Current()
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewPlanRound(*round))
}

func (h *PlanRoundHandler) List(c *gin.Context) {
	rounds, err := h.svc.List()
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewPlanRounds(rounds))
}
