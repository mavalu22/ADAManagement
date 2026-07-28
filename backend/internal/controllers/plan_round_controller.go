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

func (h *PlanRoundHandler) Delete(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}
	if err := h.svc.Delete(id); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Rodada apagada"})
}

func (h *PlanRoundHandler) Reopen(c *gin.Context) {
	id, ok := parseIDParam(c)
	if !ok {
		return
	}
	round, err := h.svc.Reopen(id)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewPlanRound(*round))
}

// Cohort devolve a rodada e seus alunos (PAE/PIC do semestre-base).
// A rodada é identificada por ?round_id=X (evita conflito de rota com
// /rounds/current).
func (h *PlanRoundHandler) Cohort(c *gin.Context) {
	roundID, err := queryUintRequired(c, "round_id")
	if err != nil {
		respondError(c, err)
		return
	}
	round, students, err := h.svc.Cohort(roundID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"round":    dto.NewPlanRound(*round),
		"students": students,
	})
}

type studentRoundResponse struct {
	Round              dto.PlanRound    `json:"round"`
	Status             string           `json:"status"`
	Period1Disciplines []dto.Discipline `json:"period1_disciplines"`
	Period2Disciplines []dto.Discipline `json:"period2_disciplines"`
}

// StudentRounds devolve as rodadas do aluno (onde ele esteve em PAE/PIC no
// semestre-base) com as disciplinas já registradas em cada período.
func (h *PlanRoundHandler) StudentRounds(c *gin.Context) {
	entries, err := h.svc.StudentRounds(c.Param("registration"))
	if err != nil {
		respondError(c, err)
		return
	}

	out := make([]studentRoundResponse, len(entries))
	for i, e := range entries {
		out[i] = studentRoundResponse{
			Round:              dto.NewPlanRound(e.Round),
			Status:             e.Status,
			Period1Disciplines: dto.NewDisciplines(e.Period1Disciplines),
			Period2Disciplines: dto.NewDisciplines(e.Period2Disciplines),
		}
	}
	c.JSON(http.StatusOK, out)
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
