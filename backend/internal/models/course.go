package models

import "gorm.io/gorm"

type Course struct {
	gorm.Model
	Code        int    `json:"code" gorm:"uniqueIndex"`
	Name        string `json:"name"`
	Coordinator string `json:"coordinator"`
}
