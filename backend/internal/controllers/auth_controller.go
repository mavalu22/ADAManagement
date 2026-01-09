package controllers

import (
	"adamanagement/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"` // Opcional, default "user"
}

func LoginHandler(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := services.Login(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Retorna token E dados do usuário (nome, role)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID, // <--- ADICIONE ESTA LINHA
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func RegisterHandler(c *gin.Context) {
	// Verifica permissão (Admin)
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Apenas administradores podem criar novos usuários."})
		return
	}

	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Tenta criar
	if err := services.CreateUser(input.Name, input.Email, input.Password, input.Role); err != nil {
		// Se o erro for de duplicidade, retorna 409 (Conflict)
		if err.Error() == "este e-mail já está cadastrado no sistema" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}

		// Outros erros (banco, hash, etc)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuário criado com sucesso"})
}
