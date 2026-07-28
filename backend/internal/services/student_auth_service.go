package services

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// StudentAuthService cuida do autocadastro e do login do aluno. Reusa o
// mesmo maquinário de JWT/BCrypt do staff; a identidade do aluno é a
// própria matrícula (não há e-mail nos dados importados).
type StudentAuthService struct {
	db        *gorm.DB
	jwtSecret []byte
}

func NewStudentAuthService(db *gorm.DB, jwtSecret string) *StudentAuthService {
	return &StudentAuthService{db: db, jwtSecret: []byte(jwtSecret)}
}

// Register cria o acesso do aluno (RN16): exige matrícula já importada e
// ainda sem senha definida; grava a senha em hash BCrypt. Login = matrícula.
func (s *StudentAuthService) Register(registration, password string) error {
	registration = strings.TrimSpace(registration)
	if registration == "" {
		return Invalid("matrícula é obrigatória")
	}
	if len(password) < 6 {
		return Invalid("a senha deve ter pelo menos 6 caracteres")
	}

	var student models.Student
	if err := s.db.Where("registration = ?", registration).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Matrícula não encontrada")
		}
		return err
	}
	if student.Password != "" {
		return Conflict("Já existe uma conta para esta matrícula. Faça login.")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.db.Model(&student).Update("password", string(hash)).Error
}

// Login valida matrícula + senha e emite JWT com role="student".
func (s *StudentAuthService) Login(registration, password string) (string, *models.Student, error) {
	var student models.Student
	if err := s.db.Preload("Course").
		Where("registration = ?", strings.TrimSpace(registration)).
		First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, Unauthorized("matrícula ou senha incorretos")
		}
		return "", nil, err
	}

	if student.Password == "" {
		// Conta ainda não criada — mensagem genérica evita revelar matrículas.
		return "", nil, Unauthorized("matrícula ou senha incorretos")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(student.Password), []byte(password)); err != nil {
		return "", nil, Unauthorized("matrícula ou senha incorretos")
	}

	now := time.Now()
	claims := &Claims{
		Role:         models.RoleStudent,
		StudentID:    student.ID,
		Registration: student.Registration,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(TokenTTL)),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
	if err != nil {
		return "", nil, err
	}
	return token, &student, nil
}

// Me retorna o aluno (com curso) e o enquadramento mais recente.
func (s *StudentAuthService) Me(studentID uint) (*models.Student, string, error) {
	var student models.Student
	if err := s.db.Preload("Course").First(&student, studentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", NotFound("Aluno não encontrado")
		}
		return nil, "", err
	}

	status, err := latestStatus(s.db, student.ID)
	if err != nil {
		return nil, "", err
	}
	return &student, status, nil
}
