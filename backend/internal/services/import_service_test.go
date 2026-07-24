package services

import (
	"errors"
	"testing"
)

func headerRow() []string {
	return []string{
		"PERIODO_BASE_ENQUADRAMENTO", "COD_CURSO", "NOME_CURSO", "COORDENADOR_CURSO",
		"MATR_ALUNO", "NOME_ALUNO", "ANO_INGRESSO", "PERIODO_INGRESSO", "TIPO_COTA_INGRESSO",
		"ENQUADRAMENTO", "ACOMPANHAMENTO_ENQUADRAMENTO", "CH_INTEGRALIZADA",
		"CH_TOTAL_DISCIPLINAS_CONTAR", "NUM_DISC_OBR_FALTANTES", "NUM_SEMESTRES_SEM_CH",
		"NUM_TRANCAMENTOS",
	}
}

func TestParseRowsMapsColumns(t *testing.T) {
	raw := [][]string{
		headerRow(),
		{"2025/2", "101", "Ciência da Computação", "Coord Teste", "2022201234", "Aluna Teste",
			"2022", "1", "Ampla concorrência", "PAE", "Detalhe", "1200", "3200", "10", "2", "1"},
	}

	parsed, err := parseRows(raw)
	if err != nil {
		t.Fatalf("parseRows retornou erro: %v", err)
	}
	if parsed.Skipped != 0 || len(parsed.Rows) != 1 {
		t.Fatalf("esperava 1 linha válida e 0 ignoradas; obtive %d/%d", len(parsed.Rows), parsed.Skipped)
	}

	row := parsed.Rows[0]
	if row.SemesterCode != "2025/2" || row.CourseCode != 101 || row.Registration != "2022201234" {
		t.Errorf("chaves mal mapeadas: %+v", row)
	}
	if row.Status != "PAE" || row.IntegralizedHours != 1200 || row.TotalHours != 3200 ||
		row.PendingObligatory != 10 || row.SemestersNoHours != 2 || row.Locks != 1 {
		t.Errorf("campos do registro acadêmico mal mapeados: %+v", row)
	}
	if row.EntryYear != 2022 || row.QuotaType != "Ampla concorrência" || row.StudentName != "Aluna Teste" {
		t.Errorf("campos do aluno mal mapeados: %+v", row)
	}
}

func TestParseRowsHeaderCaseInsensitive(t *testing.T) {
	raw := [][]string{
		{" matr_aluno ", "PERIODO_BASE_ENQUADRAMENTO", "cod_curso"},
		{"2022201234", "2025/1", "42"},
	}

	parsed, err := parseRows(raw)
	if err != nil {
		t.Fatalf("parseRows retornou erro: %v", err)
	}
	if len(parsed.Rows) != 1 || parsed.Rows[0].CourseCode != 42 {
		t.Fatalf("cabeçalho com caixa/espaços diferentes não reconhecido: %+v", parsed)
	}
}

func TestParseRowsMissingEssentialColumns(t *testing.T) {
	raw := [][]string{
		{"COD_CURSO", "NOME_ALUNO"},
		{"101", "Aluno"},
	}

	if _, err := parseRows(raw); !errors.Is(err, ErrInvalid) {
		t.Fatalf("esperava ErrInvalid para colunas essenciais ausentes; obtive %v", err)
	}
}

func TestParseRowsSkipsInvalidRows(t *testing.T) {
	raw := [][]string{
		headerRow(),
		// sem matrícula
		{"2025/2", "101", "Curso", "Coord", "", "Sem Matrícula", "", "", "", "", "", "", "", "", "", ""},
		// sem semestre
		{"", "101", "Curso", "Coord", "2022201234", "Sem Semestre", "", "", "", "", "", "", "", "", "", ""},
		// código de curso não numérico (bug antigo: vinculava ao curso errado)
		{"2025/2", "abc", "Curso", "Coord", "2022201235", "Curso Inválido", "", "", "", "", "", "", "", "", "", ""},
		// linha válida
		{"2025/2", "101", "Curso", "Coord", "2022201236", "Válida", "2022", "1", "", "PIC", "", "0", "0", "0", "0", "0"},
	}

	parsed, err := parseRows(raw)
	if err != nil {
		t.Fatalf("parseRows retornou erro: %v", err)
	}
	if parsed.Skipped != 3 {
		t.Errorf("esperava 3 linhas ignoradas; obtive %d", parsed.Skipped)
	}
	if len(parsed.Rows) != 1 || parsed.Rows[0].Registration != "2022201236" {
		t.Errorf("esperava exatamente a linha válida; obtive %+v", parsed.Rows)
	}
}
