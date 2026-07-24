package services

import (
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// Escopos das regras de triagem (RN02 e RN03). São a única definição dos
// critérios — o relatório acadêmico e o painel de indicadores os reutilizam.

// criticalScope: aluno ainda "Em regularidade", mas com mais de um
// trancamento ou mais de um semestre sem carga horária (RN02).
func criticalScope(q *gorm.DB) *gorm.DB {
	return q.Where("academic_records.status = ?", models.StatusRegular).
		Where("(academic_records.locks > 1 OR academic_records.semesters_no_hours > 1)")
}

// nearGraduationScope: aluno "Em regularidade" com até maxPending
// disciplinas obrigatórias pendentes (RN03).
func nearGraduationScope(q *gorm.DB, maxPending int) *gorm.DB {
	return q.Where("academic_records.status = ?", models.StatusRegular).
		Where("academic_records.pending_obligatory <= ?", maxPending)
}
