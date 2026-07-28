package services

import (
	"errors"
	"testing"

	"github.com/golang-jwt/jwt/v5"

	"adamanagement/backend/internal/models"
)

const testSecret = "test-secret"

func TestStudentRegisterUnknownRegistration(t *testing.T) {
	db := newTestDB(t)
	svc := NewStudentAuthService(db, testSecret)

	if err := svc.Register("9999999", "senha123"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("matrícula inexistente deve dar ErrNotFound; obtive %v", err)
	}
}

func TestStudentRegisterShortPassword(t *testing.T) {
	db := newTestDB(t)
	svc := NewStudentAuthService(db, testSecret)
	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)

	if err := svc.Register("2022001", "123"); !errors.Is(err, ErrInvalid) {
		t.Fatalf("senha curta deve dar ErrInvalid; obtive %v", err)
	}
}

func TestStudentRegisterDuplicate(t *testing.T) {
	db := newTestDB(t)
	svc := NewStudentAuthService(db, testSecret)
	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)

	if err := svc.Register("2022001", "senha123"); err != nil {
		t.Fatalf("primeiro cadastro deve funcionar; obtive %v", err)
	}
	if err := svc.Register("2022001", "outra123"); !errors.Is(err, ErrConflict) {
		t.Fatalf("segundo cadastro deve dar ErrConflict; obtive %v", err)
	}
}

func TestStudentLoginFlow(t *testing.T) {
	db := newTestDB(t)
	svc := NewStudentAuthService(db, testSecret)
	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)

	// Sem conta criada → não autentica.
	if _, _, err := svc.Login("2022001", "senha123"); !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("login antes do cadastro deve dar ErrUnauthorized; obtive %v", err)
	}

	if err := svc.Register("2022001", "senha123"); err != nil {
		t.Fatalf("cadastro: %v", err)
	}

	// Senha errada.
	if _, _, err := svc.Login("2022001", "errada"); !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("senha errada deve dar ErrUnauthorized; obtive %v", err)
	}

	// Sucesso: token carrega role="student" e a matrícula.
	token, student, err := svc.Login("2022001", "senha123")
	if err != nil {
		t.Fatalf("login válido: %v", err)
	}
	if student.Registration != "2022001" {
		t.Errorf("aluno errado: %s", student.Registration)
	}

	claims := &Claims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(*jwt.Token) (any, error) {
		return []byte(testSecret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil || !parsed.Valid {
		t.Fatalf("token inválido: %v", err)
	}
	if claims.Role != models.RoleStudent {
		t.Errorf("role esperado student; obtive %q", claims.Role)
	}
	if claims.Registration != "2022001" || claims.StudentID != student.ID {
		t.Errorf("claims do aluno incorretos: %+v", claims)
	}
	if claims.UserID != 0 {
		t.Errorf("token de aluno não deve carregar UserID; obtive %d", claims.UserID)
	}
}

func TestStudentMeReturnsLatestStatus(t *testing.T) {
	db := newTestDB(t)
	svc := NewStudentAuthService(db, testSecret)
	student := seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPIC)

	_, status, err := svc.Me(student.ID)
	if err != nil {
		t.Fatalf("Me: %v", err)
	}
	if status != models.StatusPIC {
		t.Errorf("status esperado PIC; obtive %q", status)
	}
}
