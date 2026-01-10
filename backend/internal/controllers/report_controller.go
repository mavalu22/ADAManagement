package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

// 1. Listar todos os semestres (Para o Dropdown do Header)
func GetSemestersHandler(c *gin.Context) {
	var semesters []models.Semester
	// Ordena do mais recente para o mais antigo
	if result := database.DB.Order("code desc").Find(&semesters); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar semestres"})
		return
	}
	c.JSON(http.StatusOK, semesters)
}

// 2. Relatório de Registros Acadêmicos (Filtrado por Semestre)
func GetAcademicRecordsReportHandler(c *gin.Context) {
	// Query Base com todos os Joins necessários para filtrar por tabelas relacionadas
	query := database.DB.Model(&models.AcademicRecord{}).
		Joins("JOIN students ON students.id = academic_records.student_id").
		Joins("JOIN courses ON courses.id = students.course_id").
		Preload("Student").
		Preload("Student.Course").
		Preload("Semester")

	// 1. Filtro de Semestre (Obrigatório pelo contexto)
	if semID := c.Query("semester_id"); semID != "" {
		query = query.Where("academic_records.semester_id = ?", semID)
	}

	// 2. Filtros da Barra
	if reg := c.Query("registration"); reg != "" {
		query = query.Where("students.registration LIKE ?", "%"+reg+"%")
	}

	if sName := c.Query("student_name"); sName != "" {
		query = query.Where("students.name LIKE ?", "%"+sName+"%")
	}

	if cName := c.Query("course_name"); cName != "" {
		query = query.Where("courses.name LIKE ?", "%"+cName+"%")
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("academic_records.status = ?", status)
	}

	var records []models.AcademicRecord
	if err := query.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar histórico"})
		return
	}

	c.JSON(http.StatusOK, records)
}

// 3. Relatório de Cursos (Resumo por Semestre)
func GetCoursesReportHandler(c *gin.Context) {
	query := database.DB.Model(&models.Course{})

	if code := c.Query("code"); code != "" {
		// Código geralmente é exato, mas se for int no banco, o GORM converte a string
		query = query.Where("code = ?", code)
	}

	if name := c.Query("name"); name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	var courses []models.Course
	if err := query.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar cursos"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// 4. Relatório de Alunos (Filtrado por Semestre - Alunos ativos naquele semestre)
func GetStudentsReportHandler(c *gin.Context) {
	// Inicia a query base
	query := database.DB.Model(&models.Student{}).Preload("Course")

	// 1. Filtro de Semestre (Vem do Contexto do Front)
	// Se vier semester_id, fazemos um JOIN para pegar só quem tem matéria nesse semestre
	if semID := c.Query("semester_id"); semID != "" {
		query = query.Joins("JOIN academic_records ON academic_records.student_id = students.id").
			Where("academic_records.semester_id = ?", semID).
			Group("students.id") // Evita duplicatas se o aluno tiver várias matérias
	}

	// 2. Filtros de Texto (Vêm da Barra de Filtros)
	if reg := c.Query("registration"); reg != "" {
		query = query.Where("students.registration LIKE ?", "%"+reg+"%")
	}

	if name := c.Query("name"); name != "" {
		// ILIKE é case-insensitive no Postgres. Se usar MySQL, use LIKE.
		query = query.Where("students.name LIKE ?", "%"+name+"%")
	}

	if entryYear := c.Query("entry_year"); entryYear != "" {
		query = query.Where("students.entry_year = ?", entryYear)
	}

	if quota := c.Query("quota_type"); quota != "" {
		query = query.Where("students.quota_type = ?", quota)
	}

	// Executa
	var students []models.Student
	if err := query.Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar alunos"})
		return
	}

	c.JSON(http.StatusOK, students)
}
