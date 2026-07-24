package services

import (
	"errors"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type DisciplineService struct {
	db *gorm.DB
}

func NewDisciplineService(db *gorm.DB) *DisciplineService { return &DisciplineService{db: db} }

func (s *DisciplineService) List() ([]models.Discipline, error) {
	var disciplines []models.Discipline
	if err := s.db.Order("name asc").Find(&disciplines).Error; err != nil {
		return nil, err
	}
	return disciplines, nil
}

// Create insere a disciplina e traduz a violação do índice único de
// código para conflito (RN13) — sem check-then-act.
func (s *DisciplineService) Create(code, name string) (*models.Discipline, error) {
	discipline := models.Discipline{Code: code, Name: name}
	if err := s.db.Create(&discipline).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, Conflict("Código de disciplina já cadastrado")
		}
		return nil, err
	}
	return &discipline, nil
}

func (s *DisciplineService) Update(id uint, code, name *string) (*models.Discipline, error) {
	var discipline models.Discipline
	if err := s.db.First(&discipline, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Disciplina não encontrada")
		}
		return nil, err
	}

	updates := map[string]any{}
	if code != nil {
		updates["code"] = *code
	}
	if name != nil {
		updates["name"] = *name
	}
	if len(updates) == 0 {
		return nil, Invalid("Nenhum campo fornecido para atualização")
	}

	if err := s.db.Model(&discipline).Updates(updates).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, Conflict("Código de disciplina já cadastrado")
		}
		return nil, err
	}
	return &discipline, nil
}

// Delete remove a disciplina em definitivo (hard delete): o código tem
// índice único e a exclusão lógica impediria recadastrar o mesmo código.
// As associações com planos de integralização são removidas na mesma
// transação para não deixar vínculos órfãos.
func (s *DisciplineService) Delete(id uint) error {
	var discipline models.Discipline
	if err := s.db.First(&discipline, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Disciplina não encontrada")
		}
		return err
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM study_plan_disciplines WHERE discipline_id = ?", discipline.ID).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&discipline).Error
	})
}
