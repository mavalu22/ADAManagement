// Package app monta as dependências da aplicação — configuração, banco,
// services, handlers e servidor HTTP — em um único ponto (composition
// root), sem estado global.
package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"adamanagement/backend/internal/config"
	"adamanagement/backend/internal/controllers"
	"adamanagement/backend/internal/database"
	"adamanagement/backend/internal/models"
	"adamanagement/backend/internal/routes"
	"adamanagement/backend/internal/services"
)

const shutdownTimeout = 15 * time.Second

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		return err
	}
	slog.Info("conexão com PostgreSQL estabelecida")

	if err := db.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.Semester{},
		&models.Student{},
		&models.AcademicRecord{},
		&models.StudentAction{},
		&models.Discipline{},
		&models.StudyPlan{},
	); err != nil {
		return fmt.Errorf("migração do banco: %w", err)
	}

	authSvc := services.NewAuthService(db, cfg.JWTSecret)
	created, err := authSvc.EnsureAdmin(cfg.AdminName, cfg.AdminEmail, cfg.AdminPassword)
	if err != nil {
		return fmt.Errorf("seed do administrador: %w", err)
	}
	if created {
		slog.Info("administrador padrão criado", "email", cfg.AdminEmail)
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "X-Total-Count"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", healthHandler(db))
	routes.Register(r, buildHandlers(db, authSvc), cfg.JWTSecret)

	return serve(r, cfg.Port)
}

func buildHandlers(db *gorm.DB, authSvc *services.AuthService) routes.Handlers {
	return routes.Handlers{
		Auth:        controllers.NewAuthHandler(authSvc),
		Users:       controllers.NewUserHandler(services.NewUserService(db)),
		Import:      controllers.NewImportHandler(services.NewImportService(db)),
		Reports:     controllers.NewReportHandler(services.NewReportService(db)),
		Indicators:  controllers.NewIndicatorsHandler(services.NewIndicatorsService(db)),
		Students:    controllers.NewStudentHandler(services.NewStudentService(db)),
		Actions:     controllers.NewActionHandler(services.NewActionService(db)),
		Disciplines: controllers.NewDisciplineHandler(services.NewDisciplineService(db)),
		Plans:       controllers.NewStudyPlanHandler(services.NewStudyPlanService(db)),
	}
}

// healthHandler responde ao health check da plataforma de hospedagem,
// verificando também a conectividade com o banco.
func healthHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sqlDB, err := db.DB()
		if err == nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			err = sqlDB.PingContext(ctx)
		}
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

// serve inicia o servidor HTTP com desligamento gracioso: em SIGINT ou
// SIGTERM, as conexões em andamento têm até shutdownTimeout para concluir.
func serve(handler http.Handler, port string) error {
	srv := &http.Server{Addr: ":" + port, Handler: handler}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.ListenAndServe()
	}()
	slog.Info("servidor iniciado", "port", port)

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		slog.Info("encerrando servidor")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			return err
		}
		if err := <-errCh; !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	}
}
