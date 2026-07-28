package models

import "gorm.io/gorm"

// PlanRound é a rodada de cadastro de planos de integralização aberta pela
// coordenação. Mira dois períodos futuros (escolhidos pelo coordenador) e
// controla a janela em que os alunos em PAE/PIC registram seus planos.
// Invariante de negócio: no máximo uma rodada com Open = true por vez.
type PlanRound struct {
	gorm.Model

	Period1SemesterID uint     `json:"period1_semester_id"`
	Period1           Semester `json:"period1" gorm:"foreignKey:Period1SemesterID"`

	Period2SemesterID uint     `json:"period2_semester_id"`
	Period2           Semester `json:"period2" gorm:"foreignKey:Period2SemesterID"`

	Open           bool `json:"open" gorm:"index"`
	OpenedByUserID uint `json:"opened_by_user_id"`
}
