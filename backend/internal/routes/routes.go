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
			// Validação de sessão
			protected.GET("/me", controllers.GetMeHandler)
			// Cadastro de novos users (Só Admin)
			protected.POST("/register", controllers.RegisterHandler)

			// Gestão de Usuários
			protected.GET("/users", controllers.GetUsersHandler)          // Listar
			protected.PUT("/users/:id", controllers.UpdateUserHandler)    // Editar/Promover
			protected.DELETE("/users/:id", controllers.DeleteUserHandler) // Deletar
			protected.POST("/upload", controllers.UploadCSVHandler)       // Importação
			// Auxiliar
			protected.GET("/semesters", controllers.GetSemestersHandler)
			// Relatórios
			protected.GET("/reports/records", controllers.GetAcademicRecordsReportHandler)
			protected.GET("/reports/courses", controllers.GetCoursesReportHandler)
			protected.GET("/reports/students", controllers.GetStudentsReportHandler)
			protected.GET("/students/:registration/history", controllers.GetStudentHistoryHandler)
			protected.GET("/reports/dashboard", controllers.GetDashboardIndicatorsHandler)
			// Ações por Aluno
			protected.GET("/students/:registration/actions", controllers.GetStudentActionsHandler)
			protected.POST("/students/:registration/actions", controllers.CreateStudentActionHandler)
			protected.PUT("/actions/:id", controllers.UpdateStudentActionHandler)
			protected.DELETE("/actions/:id", controllers.DeleteStudentActionHandler)
		}
	}
}
