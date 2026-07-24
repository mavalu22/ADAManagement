package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"adamanagement/backend/internal/controllers/dto"
	"adamanagement/backend/internal/services"
)

type ReportHandler struct {
	svc *services.ReportService
}

func NewReportHandler(svc *services.ReportService) *ReportHandler { return &ReportHandler{svc: svc} }

func (h *ReportHandler) Semesters(c *gin.Context) {
	semesters, err := h.svc.Semesters()
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewSemesters(semesters))
}

func (h *ReportHandler) Records(c *gin.Context) {
	limit, offset, err := pagination(c)
	if err != nil {
		respondError(c, err)
		return
	}

	maxPending, err := intQuery(c, "max_pending")
	if err != nil {
		respondError(c, err)
		return
	}

	records, total, err := h.svc.Records(services.RecordsFilter{
		SemesterID:   c.Query("semester_id"),
		Registration: c.Query("registration"),
		StudentName:  c.Query("student_name"),
		CourseName:   c.Query("course_name"),
		Status:       c.Query("status"),
		CriticalOnly: c.Query("mode") == "critical",
		MaxPending:   maxPending,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	setTotalHeader(c, total)
	c.JSON(http.StatusOK, dto.NewAcademicRecords(records))
}

func (h *ReportHandler) Courses(c *gin.Context) {
	code, err := intQuery(c, "code")
	if err != nil {
		respondError(c, err)
		return
	}

	courses, err := h.svc.Courses(services.CoursesFilter{
		Code: code,
		Name: c.Query("name"),
	})
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.NewCourses(courses))
}

func (h *ReportHandler) Students(c *gin.Context) {
	limit, offset, err := pagination(c)
	if err != nil {
		respondError(c, err)
		return
	}

	entryYear, err := intQuery(c, "entry_year")
	if err != nil {
		respondError(c, err)
		return
	}

	students, total, err := h.svc.Students(services.StudentsFilter{
		SemesterID:   c.Query("semester_id"),
		Registration: c.Query("registration"),
		Name:         c.Query("name"),
		EntryYear:    entryYear,
		QuotaType:    c.Query("quota_type"),
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	setTotalHeader(c, total)
	c.JSON(http.StatusOK, dto.NewStudents(students))
}
