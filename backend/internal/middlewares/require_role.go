package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/models"
)

// RequireAnyRole restringe o acesso aos papéis informados. Deve ser
// aplicado após Auth, que publica o papel no contexto.
func RequireAnyRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		if _, ok := allowed[Role(c)]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acesso não autorizado para este perfil"})
			return
		}
		c.Next()
	}
}

// RequireRole restringe o acesso a um único papel.
func RequireRole(role string) gin.HandlerFunc {
	return RequireAnyRole(role)
}

// RequireStaff libera apenas a coordenação (admin ou user), barrando o aluno.
func RequireStaff() gin.HandlerFunc {
	return RequireAnyRole(models.RoleAdmin, models.RoleUser)
}

// RequireSelfOrStaff protege rotas cujo recurso pertence a um aluno
// (identificado pela matrícula em :registration). O aluno só acessa a
// própria matrícula (RN20); staff acessa qualquer uma.
func RequireSelfOrStaff() gin.HandlerFunc {
	return func(c *gin.Context) {
		if Role(c) == models.RoleStudent {
			if c.Param("registration") != Registration(c) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Você só pode acessar os seus próprios dados"})
				return
			}
		}
		c.Next()
	}
}
