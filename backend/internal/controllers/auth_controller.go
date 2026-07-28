package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/middlewares"
	"adamanagement/backend/internal/models"
	"adamanagement/backend/internal/services"
)

type AuthHandler struct {
	svc        *services.AuthService
	studentSvc *services.StudentAuthService
}

func NewAuthHandler(svc *services.AuthService, studentSvc *services.StudentAuthService) *AuthHandler {
	return &AuthHandler{svc: svc, studentSvc: studentSvc}
}

type loginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type registerInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var in loginInput
	if !bindJSON(c, &in) {
		return
	}

	token, user, err := h.svc.Login(in.Email, in.Password)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Me ramifica por papel: token de aluno devolve a identidade do aluno +
// enquadramento; token de staff devolve o usuário.
func (h *AuthHandler) Me(c *gin.Context) {
	if middlewares.Role(c) == models.RoleStudent {
		studentID, ok := middlewares.StudentID(c)
		if !ok {
			respondError(c, services.Unauthorized("sessão inválida"))
			return
		}
		student, status, err := h.studentSvc.Me(studentID)
		if err != nil {
			respondError(c, err)
			return
		}
		c.JSON(http.StatusOK, dto.NewStudentMe(*student, status))
		return
	}

	id, ok := middlewares.UserID(c)
	if !ok {
		respondError(c, services.Unauthorized("sessão inválida"))
		return
	}

	user, err := h.svc.Me(id)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var in registerInput
	if !bindJSON(c, &in) {
		return
	}

	if _, err := h.svc.CreateUser(in.Name, in.Email, in.Password, in.Role); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Usuário criado com sucesso"})
}
