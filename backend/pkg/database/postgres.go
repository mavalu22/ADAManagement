package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"adamanagement/backend/config"
)

var DB *gorm.DB

func Connect() {
	dsn := config.AppConfig.DatabaseURL

	if dsn == "" {
		log.Fatal("ERRO CRÍTICO: DATABASE_URL está vazia. Verifique se o .env existe e foi carregado no main.go")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Falha ao conectar no PostgreSQL:", err)
	}

	log.Println("Conexão com PostgreSQL (Aiven) estabelecida com sucesso!")
}
