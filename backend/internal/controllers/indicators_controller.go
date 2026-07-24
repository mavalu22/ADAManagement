package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/services"
)

type IndicatorsHandler struct {
	svc *services.IndicatorsService
}

func NewIndicatorsHandler(svc *services.IndicatorsService) *IndicatorsHandler {
	return &IndicatorsHandler{svc: svc}
}

func (h *IndicatorsHandler) Dashboard(c *gin.Context) {
	dashboard, err := h.svc.Dashboard(c.Query("semester_id"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dashboard)
}
