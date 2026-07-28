package routes

import (
	"testing"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers"
)

// TestRegisterNoRouteConflict monta o roteador com handlers vazios (as
// rotas não são invocadas) e garante que o registro não entra em pânico —
// o httprouter do Gin aborta na inicialização se houver conflito entre
// segmento estático e parâmetro no mesmo método (ex.: /rounds/current vs
// /rounds/:id). Cobre o que não dá para pegar sem subir o servidor.
func TestRegisterNoRouteConflict(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := Handlers{
		Auth:        controllers.NewAuthHandler(nil, nil),
		StudentAuth: controllers.NewStudentAuthHandler(nil),
		Users:       controllers.NewUserHandler(nil),
		Import:      controllers.NewImportHandler(nil),
		Reports:     controllers.NewReportHandler(nil),
		Indicators:  controllers.NewIndicatorsHandler(nil),
		Students:    controllers.NewStudentHandler(nil),
		Actions:     controllers.NewActionHandler(nil),
		Disciplines: controllers.NewDisciplineHandler(nil),
		Plans:       controllers.NewStudyPlanHandler(nil),
		Rounds:      controllers.NewPlanRoundHandler(nil),
	}

	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("registro de rotas entrou em pânico (conflito de rota?): %v", r)
		}
	}()

	Register(gin.New(), h, "test-secret")
}
