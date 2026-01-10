package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Listar todos os usuários (Apenas Admin)
func GetUsersHandler(c *gin.Context) {
	query := database.DB.Model(&models.User{})

	if name := c.Query("name"); name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	if email := c.Query("email"); email != "" {
		query = query.Where("email LIKE ?", "%"+email+"%")
	}

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	var users []models.User
	// Omitimos a senha por segurança
	if err := query.Omit("password").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// Atualizar Usuário (Perfil ou Promoção)
func UpdateUserHandler(c *gin.Context) {
	id := c.Param("id")
	requesterRole := c.GetString("role")
	requesterID := c.GetUint("userID")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Permissão básica
	if requesterRole != "admin" && uint(user.ID) != requesterID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Email != "" {
		user.Email = input.Email
	}

	if input.Password != "" {
		hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hash)
	}

	// Regra de Role
	if input.Role != "" {
		if requesterRole == "admin" {
			// === PROTEÇÃO DO MASTER ADMIN (ID 1) ===
			if user.ID == 1 && input.Role != "admin" {
				c.JSON(http.StatusForbidden, gin.H{"error": "O Admin Principal não pode ser rebaixado."})
				return
			}
			user.Role = input.Role
		}
	}

	database.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado", "user": user})
}

func DeleteUserHandler(c *gin.Context) {
	id := c.Param("id")
	requesterID := c.GetUint("userID")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// === PROTEÇÃO DO MASTER ADMIN (ID 1) ===
	if user.ID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "O Admin Principal não pode ser excluído."})
		return
	}

	if user.ID == requesterID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Você não pode deletar a si mesmo."})
		return
	}

	database.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Usuário deletado"})
}
