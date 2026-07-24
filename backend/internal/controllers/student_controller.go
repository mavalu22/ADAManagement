package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/services"
)

type StudentHandler struct {
	svc *services.StudentService
}

func NewStudentHandler(svc *services.StudentService) *StudentHandler {
	return &StudentHandler{svc: svc}
}

func (h *StudentHandler) History(c *gin.Context) {
	student, records, err := h.svc.History(c.Param("registration"))
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student": dto.NewStudent(*student),
		"history": dto.NewAcademicRecords(records),
	})
}
