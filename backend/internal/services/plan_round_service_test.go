package services

import (
	"errors"
	"testing"

	"adamanagement/backend/internal/models"
)

func TestOpenRequiresImportedData(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)

	if _, err := rounds.Open("2026/1", "2026/2", 1); !errors.Is(err, ErrInvalid) {
		t.Fatalf("abrir sem dados deve dar ErrInvalid; obtive %v", err)
	}
}

func TestOpenCapturesLatestDataSemesterAsBase(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)

	seedStudentWithStatus(t, db, "2022001", "2024/2", models.StatusPAE)
	seedStudentWithStatus(t, db, "2022002", "2025/2", models.StatusPIC) // mais recente

	round := openRoundFor(t, rounds, "2026/1", "2026/2")

	var base models.Semester
	db.First(&base, round.BaseSemesterID)
	if base.Code != "2025/2" {
		t.Fatalf("semestre-base esperado 2025/2; obtive %q", base.Code)
	}
}

func TestCohortReturnsOnlyPaePicOfBaseSemester(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)

	seedStudentWithStatus(t, db, "A", "2025/2", models.StatusPAE)
	seedStudentWithStatus(t, db, "B", "2025/2", models.StatusPIC)
	seedStudentWithStatus(t, db, "C", "2025/2", models.StatusRegular) // fora
	seedStudentWithStatus(t, db, "D", "2024/2", models.StatusPAE)     // outro semestre

	round := openRoundFor(t, rounds, "2026/1", "2026/2") // base = 2025/2
	_, students, err := rounds.Cohort(round.ID)
	if err != nil {
		t.Fatalf("Cohort: %v", err)
	}
	if len(students) != 2 {
		t.Fatalf("esperava 2 alunos (PAE/PIC de 2025/2); obtive %d: %+v", len(students), students)
	}
	for _, s := range students {
		if s.Registration == "C" || s.Registration == "D" {
			t.Errorf("aluno %s não deveria estar no cohort", s.Registration)
		}
	}
}

func TestReopenKeepsSingleOpen(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)
	seedStudentWithStatus(t, db, "2022001", "2025/2", models.StatusPAE)

	a := openRoundFor(t, rounds, "2026/1", "2026/2")
	b := openRoundFor(t, rounds, "2026/2", "2027/1") // fecha A, B aberta

	reopened, err := rounds.Reopen(a.ID)
	if err != nil {
		t.Fatalf("Reopen: %v", err)
	}
	if !reopened.Open {
		t.Fatalf("A deveria estar aberta após reabrir")
	}

	var openCount int64
	db.Model(&models.PlanRound{}).Where("open = ?", true).Count(&openCount)
	if openCount != 1 {
		t.Fatalf("esperava 1 rodada aberta; obtive %d", openCount)
	}

	var bReloaded models.PlanRound
	db.First(&bReloaded, b.ID)
	if bReloaded.Open {
		t.Errorf("B deveria ter fechado ao reabrir A")
	}
}

func TestStudentRoundsFiltersByBaseSemesterStatus(t *testing.T) {
	db := newTestDB(t)
	rounds := NewPlanRoundService(db)

	// Aluno: regular em 2024/2 e PAE em 2025/2.
	student := seedStudentWithStatus(t, db, "2022001", "2024/2", models.StatusRegular)

	// R0 aberta quando o único semestre com dados é 2024/2 → base 2024/2.
	r0 := openRoundFor(t, rounds, "2099/1", "2099/2")

	// Chega dado mais recente (2025/2, PAE) e abre R1 → base 2025/2.
	var sem20252 models.Semester
	db.FirstOrCreate(&sem20252, models.Semester{Code: "2025/2"})
	db.Create(&models.AcademicRecord{StudentID: student.ID, SemesterID: sem20252.ID, Status: models.StatusPAE})
	r1 := openRoundFor(t, rounds, "2100/1", "2100/2")

	entries, err := rounds.StudentRounds("2022001")
	if err != nil {
		t.Fatalf("StudentRounds: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("esperava 1 rodada elegível (R1, base PAE); obtive %d", len(entries))
	}
	if entries[0].Round.ID != r1.ID {
		t.Errorf("esperava a rodada R1 (%d); obtive %d", r1.ID, entries[0].Round.ID)
	}
	_ = r0
}
