package routes

import (
	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers"
	"adamanagement/backend/internal/middlewares"
	"adamanagement/backend/internal/models"
)

// Handlers agrupa os handlers HTTP montados pelo roteador.
type Handlers struct {
	Auth        *controllers.AuthHandler
	StudentAuth *controllers.StudentAuthHandler
	Users       *controllers.UserHandler
	Import      *controllers.ImportHandler
	Reports     *controllers.ReportHandler
	Indicators  *controllers.IndicatorsHandler
	Students    *controllers.StudentHandler
	Actions     *controllers.ActionHandler
	Disciplines *controllers.DisciplineHandler
	Plans       *controllers.StudyPlanHandler
	Rounds      *controllers.PlanRoundHandler
}

// Register monta a API em /api/v1 e mantém /api como alias de
// compatibilidade para clientes anteriores ao versionamento.
func Register(r *gin.Engine, h Handlers, jwtSecret string) {
	register(r.Group("/api"), h, jwtSecret)
	register(r.Group("/api/v1"), h, jwtSecret)
}

func register(api *gin.RouterGroup, h Handlers, jwtSecret string) {
	// Público
	api.POST("/login", h.Auth.Login)
	// Prefixo singular /student evita conflito de rota com /students/:registration.
	api.POST("/student/register", h.StudentAuth.Register)
	api.POST("/student/login", h.StudentAuth.Login)

	protected := api.Group("/")
	protected.Use(middlewares.Auth(jwtSecret))
	{
		// Qualquer autenticado (staff ou aluno)
		protected.GET("/me", h.Auth.Me)
		protected.GET("/disciplines", h.Disciplines.List)
		protected.GET("/rounds/current", h.Rounds.Current)

		// Recurso do aluno: o próprio aluno (dono) ou a coordenação (RN20)
		self := protected.Group("/")
		self.Use(middlewares.RequireSelfOrStaff())
		{
			self.GET("/students/:registration/history", h.Students.History)
			self.GET("/students/:registration/rounds", h.Rounds.StudentRounds)
			self.GET("/students/:registration/plan", h.Plans.Get)
			self.POST("/students/:registration/plan", h.Plans.Create)
			self.PUT("/students/:registration/plan", h.Plans.Update)
		}

		// Coordenação (admin ou user) — alunos não têm acesso
		staff := protected.Group("/")
		staff.Use(middlewares.RequireStaff())
		{
			staff.GET("/semesters", h.Reports.Semesters)
			staff.GET("/reports/records", h.Reports.Records)
			staff.GET("/reports/courses", h.Reports.Courses)
			staff.GET("/reports/students", h.Reports.Students)
			staff.GET("/reports/dashboard", h.Indicators.Dashboard)

			staff.GET("/students/:registration/actions", h.Actions.List)
			staff.POST("/students/:registration/actions", h.Actions.Create)
			staff.PUT("/actions/:id", h.Actions.Update)
			staff.DELETE("/actions/:id", h.Actions.Delete)

			staff.POST("/disciplines", h.Disciplines.Create)
			staff.PUT("/disciplines/:id", h.Disciplines.Update)
			staff.DELETE("/disciplines/:id", h.Disciplines.Delete)

			staff.GET("/rounds", h.Rounds.List)
			staff.GET("/rounds/students", h.Rounds.Cohort) // ?round_id=X → rodada + alunos do semestre-base
			staff.POST("/rounds", h.Rounds.Open)
			staff.PUT("/rounds/:id/close", h.Rounds.Close)
			staff.PUT("/rounds/:id/reopen", h.Rounds.Reopen)
			staff.DELETE("/rounds/:id", h.Rounds.Delete)
		}

		// Perfil próprio: staff edita seu usuário; regra completa no service.
		protected.PUT("/users/:id", h.Users.Update)

		// Exclusivo do administrador
		admin := protected.Group("/")
		admin.Use(middlewares.RequireRole(models.RoleAdmin))
		{
			admin.POST("/register", h.Auth.Register)
			admin.POST("/upload", h.Import.Upload)
			admin.GET("/users", h.Users.List)
			admin.DELETE("/users/:id", h.Users.Delete)
		}
	}
}
