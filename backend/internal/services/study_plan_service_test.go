package services

import (
	"errors"
	"testing"

	"adamanagement/backend/internal/models"
)

// openRoundFor abre uma rodada com dois períodos futuros e devolve os IDs
// dos semestres-alvo.
func openRoundFor(t *testing.T, svc *PlanRoundService, p1, p2 string) *models.PlanRound {
	t.Helper()
	round, err := svc.Open(p1, p2, 1)
	if err != nil {
		t.Fatalf("abrir rodada: %v", err)
	}
	return round
}

func TestStudyPlanCreateHappyPath(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	plans := NewStudyPlanService(db, rounds)

	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)
	round := openRoundFor(t, rounds, "2026/1", "2026/2")

	plan, err := plans.Create("2022001", round.Period1SemesterID, nil)
	if err != nil {
		t.Fatalf("esperava sucesso; obtive %v", err)
	}
	if plan.SemesterID != round.Period1SemesterID {
		t.Errorf("plano no semestre errado: %d", plan.SemesterID)
	}
}

func TestStudyPlanCreateRequiresOpenRound(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	plans := NewStudyPlanService(db, rounds)

	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)
	round := openRoundFor(t, rounds, "2026/1", "2026/2")
	if err := rounds.Close(round.ID); err != nil {
		t.Fatalf("fechar rodada: %v", err)
	}

	_, err := plans.Create("2022001", round.Period1SemesterID, nil)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("rodada fechada deve bloquear (ErrForbidden); obtive %v", err)
	}
}

func TestStudyPlanCreateRejectsSemesterOutsideRound(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	plans := NewStudyPlanService(db, rounds)

	student := seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)
	openRoundFor(t, rounds, "2026/1", "2026/2")

	// O semestre "2025/2" (do registro) não é período-alvo da rodada.
	var oldSemester models.Semester
	db.Where("code = ?", "2025/2").First(&oldSemester)

	_, err := plans.Create(student.Registration, oldSemester.ID, nil)
	if !errors.Is(err, ErrInvalid) {
		t.Fatalf("semestre fora da rodada deve dar ErrInvalid; obtive %v", err)
	}
}

func TestStudyPlanCreateRejectsNonPaePic(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	plans := NewStudyPlanService(db, rounds)

	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusRegular)
	round := openRoundFor(t, rounds, "2026/1", "2026/2")

	_, err := plans.Create("2022001", round.Period1SemesterID, nil)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("aluno fora de PAE/PIC deve dar ErrForbidden; obtive %v", err)
	}
}

func TestStudyPlanEligibilityUsesBaseSemesterStatus(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	plans := NewStudyPlanService(db, rounds)

	// Antigo semestre em regularidade; o mais recente (semestre-base) é PIC → elegível.
	student := seedStudentWithStatus(t, db, "2022001", "2024/1", models.StatusRegular)
	var recent models.Semester
	db.FirstOrCreate(&recent, models.Semester{Code: "2025/2"})
	db.Create(&models.AcademicRecord{StudentID: student.ID, SemesterID: recent.ID, Status: models.StatusPIC})

	round := openRoundFor(t, rounds, "2026/1", "2026/2") // base = 2025/2 (PIC)
	if _, err := plans.Create("2022001", round.Period2SemesterID, nil); err != nil {
		t.Fatalf("status no semestre-base (PIC) deve permitir; obtive %v", err)
	}
}

func TestPlanRoundOnlyOneOpen(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	// Open exige dados importados (semestre-base).
	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)

	openRoundFor(t, rounds, "2026/1", "2026/2")
	openRoundFor(t, rounds, "2027/1", "2027/2") // períodos distintos (sobreposição é barrada)

	var openCount int64
	db.Model(&models.PlanRound{}).Where("open = ?", true).Count(&openCount)
	if openCount != 1 {
		t.Fatalf("esperava exatamente 1 rodada aberta; obtive %d", openCount)
	}
}

func TestPlanRoundOpenValidations(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)

	if _, err := rounds.Open("", "2026/2", 1); !errors.Is(err, ErrInvalid) {
		t.Errorf("período vazio deve dar ErrInvalid; obtive %v", err)
	}
	if _, err := rounds.Open("2026/1", "2026/1", 1); !errors.Is(err, ErrInvalid) {
		t.Errorf("períodos iguais devem dar ErrInvalid; obtive %v", err)
	}
}
