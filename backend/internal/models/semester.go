package models

import "gorm.io/gorm"

type Semester struct {
	gorm.Model
	Code string `json:"code" gorm:"uniqueIndex"` // Ex: "2025/1"
}
