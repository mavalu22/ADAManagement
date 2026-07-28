package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"adamanagement/backend/internal/services"
)

const (
	ctxUserID       = "userID"
	ctxStudentID    = "studentID"
	ctxRegistration = "registration"
	ctxRole         = "role"
)

// Auth valida o token JWT (somente HS256) e publica a identidade do
// requisitante no contexto com tipos definidos — leia com UserID e Role.
func Auth(jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token não fornecido"})
			return
		}

		raw, ok := strings.CutPrefix(authHeader, "Bearer ")
		if !ok || raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			return
		}

		claims := &services.Claims{}
		token, err := jwt.ParseWithClaims(raw, claims, func(*jwt.Token) (any, error) {
			return secret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido ou expirado"})
			return
		}

		c.Set(ctxUserID, claims.UserID)
		c.Set(ctxStudentID, claims.StudentID)
		c.Set(ctxRegistration, claims.Registration)
		c.Set(ctxRole, claims.Role)
		c.Next()
	}
}

// UserID devolve o identificador do usuário (staff) autenticado.
func UserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(ctxUserID)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}

// StudentID devolve o identificador do aluno autenticado (role="student").
func StudentID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(ctxStudentID)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}

// Registration devolve a matrícula do aluno autenticado.
func Registration(c *gin.Context) string {
	return c.GetString(ctxRegistration)
}

// Role devolve o papel do usuário autenticado.
func Role(c *gin.Context) string {
	return c.GetString(ctxRole)
}
