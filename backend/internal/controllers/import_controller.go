package controllers

import (
	"adamanagement/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UploadCSVHandler(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo não enviado"})
		return
	}
	defer file.Close()

	err = services.ProcessFile(file, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Importação concluída com sucesso!"})
}
