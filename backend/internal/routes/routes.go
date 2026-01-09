package routes

import (
	"adamanagement/backend/internal/controllers"
	"adamanagement/backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/login", controllers.LoginHandler)

		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			// Cadastro de novos users (Só Admin)
			protected.POST("/register", controllers.RegisterHandler)

			// Gestão de Usuários
			protected.GET("/users", controllers.GetUsersHandler)          // Listar
			protected.PUT("/users/:id", controllers.UpdateUserHandler)    // Editar/Promover
			protected.DELETE("/users/:id", controllers.DeleteUserHandler) // Deletar
		}
	}
}
