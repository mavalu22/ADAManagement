package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/middlewares"
	"adamanagement/backend/internal/services"
)

type AuthHandler struct {
	svc *services.AuthService
}

func NewAuthHandler(svc *services.AuthService) *AuthHandler { return &AuthHandler{svc: svc} }

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

func (h *AuthHandler) Me(c *gin.Context) {
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
