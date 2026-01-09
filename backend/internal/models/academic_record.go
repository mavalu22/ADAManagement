package models

import "gorm.io/gorm"

type AcademicRecord struct {
	gorm.Model

	StudentID uint    `json:"student_id" gorm:"uniqueIndex:idx_student_semester"`
	Student   Student `json:"student" gorm:"foreignKey:StudentID"`

	SemesterID uint     `json:"semester_id" gorm:"uniqueIndex:idx_student_semester"`
	Semester   Semester `json:"semester" gorm:"foreignKey:SemesterID"`

	Status            string `json:"status"`
	StatusDetail      string `json:"status_detail"`
	IntegralizedHours int    `json:"integralized_hours"`
	TotalHours        int    `json:"total_hours"`
	PendingObligatory int    `json:"pending_obligatory"`
	SemestersNoHours  int    `json:"semesters_no_hours"`
	Locks             int    `json:"locks"`
}
