package controllers

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/services"
)

// respondError é o único ponto de tradução erro de domínio → HTTP.
// Erros fora da taxonomia são registrados e respondidos como 500
// genérico, sem vazar detalhes internos.
func respondError(c *gin.Context, err error) {
	var status int
	switch {
	case errors.Is(err, services.ErrInvalid):
		status = http.StatusBadRequest
	case errors.Is(err, services.ErrUnauthorized):
		status = http.StatusUnauthorized
	case errors.Is(err, services.ErrForbidden):
		status = http.StatusForbidden
	case errors.Is(err, services.ErrNotFound):
		status = http.StatusNotFound
	case errors.Is(err, services.ErrConflict):
		status = http.StatusConflict
	default:
		slog.Error("erro interno", "error", err, "method", c.Request.Method, "path", c.FullPath())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno do servidor"})
		return
	}
	c.JSON(status, gin.H{"error": err.Error()})
}

// bindJSON centraliza a validação de corpo das requisições.
func bindJSON(c *gin.Context, obj any) bool {
	if err := c.ShouldBindJSON(obj); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return false
	}
	return true
}

// parseIDParam interpreta o parâmetro de rota :id.
func parseIDParam(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return 0, false
	}
	return uint(id), true
}

// intQuery interpreta um parâmetro numérico opcional da query string.
func intQuery(c *gin.Context, name string) (*int, error) {
	raw := c.Query(name)
	if raw == "" {
		return nil, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return nil, services.Invalid(name + " deve ser numérico")
	}
	return &n, nil
}

// queryUintRequired lê um parâmetro numérico obrigatório da query string.
func queryUintRequired(c *gin.Context, name string) (uint, error) {
	raw := c.Query(name)
	if raw == "" {
		return 0, services.Invalid(name + " é obrigatório")
	}
	n, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, services.Invalid(name + " inválido")
	}
	return uint(n), nil
}

// pagination lê limit/offset da query. Sem limit, a listagem completa é
// retornada (compatibilidade com o frontend atual).
func pagination(c *gin.Context) (limit, offset int, err error) {
	l, err := intQuery(c, "limit")
	if err != nil {
		return 0, 0, err
	}
	o, err := intQuery(c, "offset")
	if err != nil {
		return 0, 0, err
	}
	if l != nil && *l > 0 {
		limit = *l
	}
	if o != nil && *o > 0 {
		offset = *o
	}
	return limit, offset, nil
}

// setTotalHeader expõe o total de linhas quando a consulta foi paginada.
func setTotalHeader(c *gin.Context, total int64) {
	if total >= 0 {
		c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	}
}
