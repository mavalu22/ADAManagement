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
	var users []models.User
	// Busca todos, omitindo a senha
	if result := database.DB.Find(&users); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// Atualizar Usuário (Perfil ou Promoção)
func UpdateUserHandler(c *gin.Context) {
	id := c.Param("id")

	// Quem está fazendo a requisição?
	requesterRole := c.GetString("role")
	requesterID := c.GetUint("userID")

	// Quem será alterado?
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Permissão: Só pode editar se for Admin ou se for o próprio usuário
	// Nota: Convertemos id (string) para uint na comparação real, mas aqui simplificamos pela lógica
	// Se não for admin e tentar editar outro ID -> Proibido.
	// (Implementação simplificada: Admin pode tudo, User só pode ele mesmo)
	if requesterRole != "admin" && uint(user.ID) != requesterID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Sem permissão"})
		return
	}

	// Dados de entrada
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

	// Atualizações
	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Email != "" {
		user.Email = input.Email
	}

	// Senha (Hash se for alterada)
	if input.Password != "" {
		hash, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hash)
	}

	// Role (Só Admin pode alterar Role)
	if input.Role != "" {
		if requesterRole == "admin" {
			user.Role = input.Role
		} else {
			// Se usuário comum tentar mudar role, ignoramos ou damos erro. Vamos ignorar silenciosamente.
		}
	}

	database.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado", "user": user})
}

// Deletar Usuário (Apenas Admin)
func DeleteUserHandler(c *gin.Context) {
	id := c.Param("id")

	// Impede que o usuário delete a si mesmo (para evitar ficar sem admin)
	requesterID := c.GetUint("userID")
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	if user.ID == requesterID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Você não pode deletar a si mesmo."})
		return
	}

	database.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Usuário deletado"})
}
