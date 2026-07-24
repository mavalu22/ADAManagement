package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/services"
)

type ImportHandler struct {
	svc *services.ImportService
}

func NewImportHandler(svc *services.ImportService) *ImportHandler { return &ImportHandler{svc: svc} }

// Upload recebe a planilha institucional (CSV ou XLSX) e delega o
// processamento transacional ao service, devolvendo o resumo (UC08).
func (h *ImportHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado"})
		return
	}
	defer file.Close()

	summary, err := h.svc.Process(file, header.Filename)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Importação concluída com sucesso!",
		"summary": summary,
	})
}
