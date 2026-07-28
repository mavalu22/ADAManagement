package models

import "gorm.io/gorm"

type Student struct {
	gorm.Model
	Registration string `json:"registration" gorm:"uniqueIndex"`
	Name         string `json:"name"`
	EntryYear    int    `json:"entry_year"`
	EntryPeriod  string `json:"entry_period"`
	QuotaType    string `json:"quota_type"`

	// Password é o hash BCrypt definido pelo aluno no autocadastro
	// (login = matrícula). Vazio enquanto o aluno não criou acesso.
	Password string `json:"-"`

	CourseID uint   `json:"course_id"`
	Course   Course `json:"course" gorm:"foreignKey:CourseID"`
}
