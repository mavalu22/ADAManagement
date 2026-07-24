package routes

import (
	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers"
	"adamanagement/backend/internal/middlewares"
)

// Handlers agrupa os handlers HTTP montados pelo roteador.
type Handlers struct {
	Auth        *controllers.AuthHandler
	Users       *controllers.UserHandler
	Import      *controllers.ImportHandler
	Reports     *controllers.ReportHandler
	Indicators  *controllers.IndicatorsHandler
	Students    *controllers.StudentHandler
	Actions     *controllers.ActionHandler
	Disciplines *controllers.DisciplineHandler
	Plans       *controllers.StudyPlanHandler
}

// Register monta a API em /api/v1 e mantém /api como alias de
// compatibilidade para clientes anteriores ao versionamento.
func Register(r *gin.Engine, h Handlers, jwtSecret string) {
	register(r.Group("/api"), h, jwtSecret)
	register(r.Group("/api/v1"), h, jwtSecret)
}

func register(api *gin.RouterGroup, h Handlers, jwtSecret string) {
	api.POST("/login", h.Auth.Login)

	protected := api.Group("/")
	protected.Use(middlewares.Auth(jwtSecret))
	{
		protected.GET("/me", h.Auth.Me)
		protected.PUT("/users/:id", h.Users.Update) // edição do próprio perfil; regras no service

		protected.GET("/semesters", h.Reports.Semesters)
		protected.GET("/reports/records", h.Reports.Records)
		protected.GET("/reports/courses", h.Reports.Courses)
		protected.GET("/reports/students", h.Reports.Students)
		protected.GET("/reports/dashboard", h.Indicators.Dashboard)

		protected.GET("/students/:registration/history", h.Students.History)

		protected.GET("/students/:registration/actions", h.Actions.List)
		protected.POST("/students/:registration/actions", h.Actions.Create)
		protected.PUT("/actions/:id", h.Actions.Update)
		protected.DELETE("/actions/:id", h.Actions.Delete)

		protected.GET("/disciplines", h.Disciplines.List)
		protected.POST("/disciplines", h.Disciplines.Create)
		protected.PUT("/disciplines/:id", h.Disciplines.Update)
		protected.DELETE("/disciplines/:id", h.Disciplines.Delete)

		protected.GET("/students/:registration/plan", h.Plans.Get)
		protected.POST("/students/:registration/plan", h.Plans.Create)
		protected.PUT("/students/:registration/plan", h.Plans.Update)

		// Funções administrativas: o papel é verificado no servidor,
		// não apenas ocultado na interface.
		admin := protected.Group("/")
		admin.Use(middlewares.RequireRole("admin"))
		{
			admin.POST("/register", h.Auth.Register)
			admin.POST("/upload", h.Import.Upload)
			admin.GET("/users", h.Users.List)
			admin.DELETE("/users/:id", h.Users.Delete)
		}
	}
}
