package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole restringe o acesso ao papel informado. Deve ser aplicado
// após Auth, que publica o papel no contexto.
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if Role(c) != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			return
		}
		c.Next()
	}
}
