package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/middlewares"
	"adamanagement/backend/internal/services"
)

type UserHandler struct {
	svc *services.UserService
}

func NewUserHandler(svc *services.UserService) *UserHandler { return &UserHandler{svc: svc} }

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.svc.List(services.UserListFilter{
		Name:  c.Query("name"),
		Email: c.Query("email"),
		Role:  c.Query("role"),
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewUsers(users))
}

type userUpdateInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func (h *UserHandler) Update(c *gin.Context) {
	targetID, ok := parseIDParam(c)
	if !ok {
		return
	}

	requesterID, ok := middlewares.UserID(c)
	if !ok {
		respondError(c, services.Unauthorized("sessão inválida"))
		return
	}

	var in userUpdateInput
	if !bindJSON(c, &in) {
		return
	}

	user, err := h.svc.Update(requesterID, middlewares.Role(c), targetID, services.UserUpdateInput{
		Name:     in.Name,
		Email:    in.Email,
		Password: in.Password,
		Role:     in.Role,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado", "user": dto.NewUser(*user)})
}

func (h *UserHandler) Delete(c *gin.Context) {
	targetID, ok := parseIDParam(c)
	if !ok {
		return
	}

	requesterID, ok := middlewares.UserID(c)
	if !ok {
		respondError(c, services.Unauthorized("sessão inválida"))
		return
	}

	if err := h.svc.Delete(requesterID, targetID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Usuário deletado"})
}
