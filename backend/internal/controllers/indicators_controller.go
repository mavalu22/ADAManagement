package controllers

import (
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DashboardData struct {
	StatusDistribution     []ChartData             `json:"status_distribution"`
	CriticalStudents       []CriticalStudent       `json:"critical_students"`
	NearGraduationStudents []NearGraduationStudent `json:"near_graduation_students"`
}

type ChartData struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Extra string  `json:"extra,omitempty"`
}

type CriticalStudent struct {
	ID           uint   `json:"id"`
	Registration string `json:"registration"`
	Name         string `json:"name"`
	Locks        int    `json:"locks"`
	NoHours      int    `json:"no_hours"`
}

type NearGraduationStudent struct {
	ID                uint   `json:"id"`
	Registration      string `json:"registration"`
	Name              string `json:"name"`
	Course            string `json:"course"`
	PendingObligatory int    `json:"pending_obligatory"`
}

func GetDashboardIndicatorsHandler(c *gin.Context) {
	semesterID := c.Query("semester_id")
	if semesterID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "semester_id é obrigatório"})
		return
	}

	var dashboard DashboardData

	database.DB.Model(&models.AcademicRecord{}).
		Select("status as name, COUNT(id) as value").
		Where("semester_id = ?", semesterID).
		Group("status").
		Scan(&dashboard.StatusDistribution)

	database.DB.Table("academic_records").
		Select("students.id, students.registration, students.name, academic_records.locks, academic_records.semesters_no_hours as no_hours").
		Joins("JOIN students ON students.id = academic_records.student_id").
		Where("academic_records.semester_id = ?", semesterID).
		Where("academic_records.status = ?", "Em regularidade").
		Where("(academic_records.locks > ? OR academic_records.semesters_no_hours > ?)", 1, 1).
		Order("academic_records.locks DESC, academic_records.semesters_no_hours DESC").
		Scan(&dashboard.CriticalStudents)

	database.DB.Table("academic_records").
		Select("students.id, students.registration, students.name, courses.name as course, academic_records.pending_obligatory").
		Joins("JOIN students ON students.id = academic_records.student_id").
		Joins("JOIN courses ON courses.id = students.course_id").
		Where("academic_records.semester_id = ?", semesterID).
		Where("academic_records.status = ?", "Em regularidade").
		Where("academic_records.pending_obligatory <= ?", 6).
		Order("academic_records.pending_obligatory ASC").
		Scan(&dashboard.NearGraduationStudents)

	c.JSON(http.StatusOK, dashboard)
}
