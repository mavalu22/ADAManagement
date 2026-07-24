package services

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// isUniqueViolation identifica violações de índice único do PostgreSQL
// (código 23505), permitindo trocar o padrão check-then-act — sujeito a
// corrida — por tentativa de escrita seguida de tradução do erro.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
