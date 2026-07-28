package models

// Papéis de acesso. Staff (coordenação) usa Admin/User na tabela users;
// Student identifica o token do aluno autenticado contra a tabela students.
const (
	RoleAdmin   = "admin"
	RoleUser    = "user"
	RoleStudent = "student"
)
