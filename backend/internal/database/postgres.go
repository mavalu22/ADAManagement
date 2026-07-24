package database

import (
	"errors"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect abre a conexão com o PostgreSQL e a devolve ao chamador —
// não há estado global; a dependência é injetada em quem precisa dela.
func Connect(dsn string) (*gorm.DB, error) {
	if dsn == "" {
		return nil, errors.New("DATABASE_URL vazia")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar no PostgreSQL: %w", err)
	}
	return db, nil
}
