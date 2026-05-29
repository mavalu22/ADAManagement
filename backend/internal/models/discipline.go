package models

import "gorm.io/gorm"

type Discipline struct {
	gorm.Model
	Code string `json:"code" gorm:"uniqueIndex"`
	Name string `json:"name"`
}
