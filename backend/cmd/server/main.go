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
	// 1. Carregar Configurações (.env)
	config.LoadConfig()

	// 2. Inicializa Banco
	database.InitDB()

	// ==========================================================
	// LIMPEZA TOTAL (RESET)
	// ==========================================================
	// Apaga a tabela de usuários existente para começar limpo.
	// Se tiver outras tabelas no futuro (ex: Alunos), adicione aqui também.
	log.Println("🧹 Limpando banco de dados...")
	database.DB.Migrator().DropTable(&models.User{})
	// ==========================================================

	// Recria a tabela vazia
	err := database.DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Erro na migração:", err)
	}

	// 3. Garante o Admin (Recria o admin pois o banco foi limpo)
	services.EnsureAdmin()

	// 4. Configura Gin
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(r)

	port := config.AppConfig.Port
	fmt.Printf("🚀 Servidor rodando na porta %s\n", port)
	r.Run(":" + port)
}
