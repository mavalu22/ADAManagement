package services

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type PlanRoundService struct {
	db *gorm.DB
}

func NewPlanRoundService(db *gorm.DB) *PlanRoundService { return &PlanRoundService{db: db} }

// Open abre uma rodada para os dois períodos informados (RN17). Garante os
// semestres pelos códigos, fecha qualquer rodada aberta e cria a nova aberta
// na mesma transação — mantendo o invariante de no máximo uma aberta (RN19).
func (s *PlanRoundService) Open(period1Code, period2Code string, userID uint) (*models.PlanRound, error) {
	period1Code = strings.TrimSpace(period1Code)
	period2Code = strings.TrimSpace(period2Code)

	if period1Code == "" || period2Code == "" {
		return nil, Invalid("informe os dois períodos da rodada")
	}
	if period1Code == period2Code {
		return nil, Invalid("os dois períodos devem ser diferentes")
	}

	var round models.PlanRound
	err := s.db.Transaction(func(tx *gorm.DB) error {
		sem1, err := ensureSemester(tx, period1Code)
		if err != nil {
			return err
		}
		sem2, err := ensureSemester(tx, period2Code)
		if err != nil {
			return err
		}

		if err := tx.Model(&models.PlanRound{}).Where("open = ?", true).
			Update("open", false).Error; err != nil {
			return err
		}

		round = models.PlanRound{
			Period1SemesterID: sem1.ID,
			Period2SemesterID: sem2.ID,
			Open:              true,
			OpenedByUserID:    userID,
		}
		return tx.Create(&round).Error
	})
	if err != nil {
		return nil, err
	}

	return s.load(round.ID)
}

// Close encerra a rodada, impedindo novos registros/edições de plano.
func (s *PlanRoundService) Close(id uint) error {
	var round models.PlanRound
	if err := s.db.First(&round, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Rodada não encontrada")
		}
		return err
	}
	return s.db.Model(&round).Update("open", false).Error
}

// Current devolve a rodada aberta (RN19: no máximo uma).
func (s *PlanRoundService) Current() (*models.PlanRound, error) {
	var round models.PlanRound
	err := s.db.Preload("Period1").Preload("Period2").
		Where("open = ?", true).
		Order("id desc").
		First(&round).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Nenhuma rodada de cadastro aberta")
		}
		return nil, err
	}
	return &round, nil
}

// currentOrNil devolve a rodada aberta ou (nil, nil) quando não há —
// usado pela elegibilidade do plano sem tratar "ausência" como erro.
func (s *PlanRoundService) currentOrNil() (*models.PlanRound, error) {
	round, err := s.Current()
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return round, nil
}

func (s *PlanRoundService) List() ([]models.PlanRound, error) {
	var rounds []models.PlanRound
	if err := s.db.Preload("Period1").Preload("Period2").
		Order("id desc").Find(&rounds).Error; err != nil {
		return nil, err
	}
	return rounds, nil
}

func (s *PlanRoundService) load(id uint) (*models.PlanRound, error) {
	var round models.PlanRound
	if err := s.db.Preload("Period1").Preload("Period2").First(&round, id).Error; err != nil {
		return nil, err
	}
	return &round, nil
}

// ensureSemester localiza ou cria o semestre pelo código. Os períodos-alvo
// são futuros e ainda não importados; quando os dados reais chegarem, a
// importação casa pelo mesmo código (FirstOrCreate) — sem duplicação.
func ensureSemester(tx *gorm.DB, code string) (*models.Semester, error) {
	var semester models.Semester
	if err := tx.FirstOrCreate(&semester, models.Semester{Code: code}).Error; err != nil {
		return nil, err
	}
	return &semester, nil
}

// isTargetSemester informa se o semestre é um dos dois períodos da rodada.
func isTargetSemester(round *models.PlanRound, semesterID uint) bool {
	return semesterID == round.Period1SemesterID || semesterID == round.Period2SemesterID
}
