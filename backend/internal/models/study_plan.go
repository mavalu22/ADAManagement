package models

import "gorm.io/gorm"

type StudyPlan struct {
	gorm.Model
	StudentID   uint         `json:"student_id" gorm:"uniqueIndex:idx_plan_student_semester"`
	Student     Student      `json:"student" gorm:"foreignKey:StudentID"`
	SemesterID  uint         `json:"semester_id" gorm:"uniqueIndex:idx_plan_student_semester"`
	Semester    Semester     `json:"semester" gorm:"foreignKey:SemesterID"`
	Disciplines []Discipline `json:"disciplines" gorm:"many2many:study_plan_disciplines;"`
}
