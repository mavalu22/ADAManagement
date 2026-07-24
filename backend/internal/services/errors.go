package services

import "errors"

// Sentinelas de erro do domínio. Os controllers traduzem cada categoria
// para o status HTTP correspondente em um único ponto (respondError);
// os services nunca conhecem HTTP.
var (
	ErrInvalid      = errors.New("dados inválidos")
	ErrUnauthorized = errors.New("não autorizado")
	ErrForbidden    = errors.New("operação não permitida")
	ErrNotFound     = errors.New("recurso não encontrado")
	ErrConflict     = errors.New("conflito de estado")
)

type domainError struct {
	kind error
	msg  string
}

func (e *domainError) Error() string { return e.msg }
func (e *domainError) Unwrap() error { return e.kind }

func Invalid(msg string) error      { return &domainError{ErrInvalid, msg} }
func Unauthorized(msg string) error { return &domainError{ErrUnauthorized, msg} }
func Forbidden(msg string) error    { return &domainError{ErrForbidden, msg} }
func NotFound(msg string) error     { return &domainError{ErrNotFound, msg} }
func Conflict(msg string) error     { return &domainError{ErrConflict, msg} }
