package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/services"
)

// StudentAuthHandler expõe o autocadastro e o login do aluno (rotas
// públicas), separados do fluxo de staff.
type StudentAuthHandler struct {
	svc *services.StudentAuthService
}

func NewStudentAuthHandler(svc *services.StudentAuthService) *StudentAuthHandler {
	return &StudentAuthHandler{svc: svc}
}

type studentRegisterInput struct {
	Registration string `json:"registration" binding:"required"`
	Password     string `json:"password" binding:"required,min=6"`
}

func (h *StudentAuthHandler) Register(c *gin.Context) {
	var in studentRegisterInput
	if !bindJSON(c, &in) {
		return
	}
	if err := h.svc.Register(in.Registration, in.Password); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Conta criada com sucesso. Faça login com sua matrícula."})
}

type studentLoginInput struct {
	Registration string `json:"registration" binding:"required"`
	Password     string `json:"password" binding:"required"`
}

func (h *StudentAuthHandler) Login(c *gin.Context) {
	var in studentLoginInput
	if !bindJSON(c, &in) {
		return
	}

	token, student, err := h.svc.Login(in.Registration, in.Password)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":           student.ID,
			"registration": student.Registration,
			"name":         student.Name,
			"role":         "student",
		},
	})
}
