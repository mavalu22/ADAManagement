package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/models"
)

func init() { gin.SetMode(gin.TestMode) }

// runWith monta um contexto Gin com papel/matrícula do token já
// publicados e o parâmetro de rota :registration, e roda o middleware.
func runWith(role, tokenRegistration, paramRegistration string, mw gin.HandlerFunc) int {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	c.Params = gin.Params{{Key: "registration", Value: paramRegistration}}
	c.Set(ctxRole, role)
	c.Set(ctxRegistration, tokenRegistration)

	mw(c)
	if !c.IsAborted() {
		c.Status(http.StatusOK)
	}
	return w.Code
}

func TestRequireSelfOrStaff(t *testing.T) {
	mw := RequireSelfOrStaff()

	cases := []struct {
		name       string
		role       string
		tokenReg   string
		paramReg   string
		wantStatus int
	}{
		{"aluno na própria matrícula", models.RoleStudent, "2022001", "2022001", http.StatusOK},
		{"aluno em matrícula alheia", models.RoleStudent, "2022001", "2022999", http.StatusForbidden},
		{"staff (user) em qualquer aluno", models.RoleUser, "", "2022999", http.StatusOK},
		{"staff (admin) em qualquer aluno", models.RoleAdmin, "", "2022999", http.StatusOK},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := runWith(tc.role, tc.tokenReg, tc.paramReg, mw); got != tc.wantStatus {
				t.Errorf("status = %d; esperado %d", got, tc.wantStatus)
			}
		})
	}
}

func TestRequireStaffBlocksStudent(t *testing.T) {
	mw := RequireStaff()

	if got := runWith(models.RoleStudent, "2022001", "2022001", mw); got != http.StatusForbidden {
		t.Errorf("aluno em rota de staff deve dar 403; obtive %d", got)
	}
	if got := runWith(models.RoleUser, "", "", mw); got != http.StatusOK {
		t.Errorf("staff deve passar; obtive %d", got)
	}
}
