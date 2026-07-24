package controllers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/services"
)

func TestRespondErrorMapsDomainErrorsToHTTP(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name       string
		err        error
		wantStatus int
		wantBody   string
	}{
		{"invalid", services.Invalid("campo obrigatório"), http.StatusBadRequest, "campo obrigatório"},
		{"unauthorized", services.Unauthorized("credenciais"), http.StatusUnauthorized, "credenciais"},
		{"forbidden", services.Forbidden("sem permissão"), http.StatusForbidden, "sem permissão"},
		{"not found", services.NotFound("não achei"), http.StatusNotFound, "não achei"},
		{"conflict", services.Conflict("duplicado"), http.StatusConflict, "duplicado"},
		{"internal é genérico", errors.New("detalhe interno sensível"), http.StatusInternalServerError, "erro interno do servidor"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)

			respondError(c, tc.err)

			if w.Code != tc.wantStatus {
				t.Errorf("status = %d; esperado %d", w.Code, tc.wantStatus)
			}
			if !strings.Contains(w.Body.String(), tc.wantBody) {
				t.Errorf("corpo %q não contém %q", w.Body.String(), tc.wantBody)
			}
			if tc.wantStatus == http.StatusInternalServerError &&
				strings.Contains(w.Body.String(), "sensível") {
				t.Errorf("resposta 500 vazou detalhe interno: %s", w.Body.String())
			}
		})
	}
}
