package main

import (
	"fmt"
	"log"
	"time"

	"adamanagement/backend/config"
	"adamanagement/backend/internal/models"
	"adamanagement/backend/internal/routes"
	"adamanagement/backend/internal/services"
	"adamanagement/backend/pkg/database"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()

	database.Connect()
	err := database.DB.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.Semester{},
		&models.Student{},
		&models.AcademicRecord{},
	)
	if err != nil {
		log.Fatal("Erro na migração:", err)
	}

	services.EnsureAdmin()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"https://frontend-ada.onrender.com",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(r)

	port := config.AppConfig.Port
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Servidor rodando na porta %s\n", port)
	r.Run(":" + port)
}
