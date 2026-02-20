package models

import (
	"time"

	"gorm.io/gorm"
)

type StudentAction struct {
	gorm.Model
	StudentID    uint       `json:"student_id" gorm:"not null;index"`
	Student      Student    `json:"student" gorm:"foreignKey:StudentID"`
	SemesterID   uint       `json:"semester_id" gorm:"not null;index"`
	Semester     Semester   `json:"semester" gorm:"foreignKey:SemesterID"`
	ActionDate   time.Time  `json:"action_date" gorm:"not null"`
	Description  string     `json:"description" gorm:"type:varchar(500);not null"`
	ResponseDate *time.Time `json:"response_date"` // nullable – preenchido quando o aluno responde
}
