package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

// TokenTTL é a validade do token JWT (RN08).
const TokenTTL = 24 * time.Hour

// Claims é o payload dos tokens emitidos pelo sistema. O middleware de
// autenticação valida com este mesmo tipo, mantendo o contrato em um
// único lugar. Tokens de staff carregam UserID; tokens de aluno
// (role="student") carregam StudentID e Registration.
type Claims struct {
	UserID       uint   `json:"user_id,omitempty"`
	StudentID    uint   `json:"student_id,omitempty"`
	Registration string `json:"registration,omitempty"`
	Role         string `json:"role"`
	jwt.RegisteredClaims
}

type AuthService struct {
	db        *gorm.DB
	jwtSecret []byte
}

func NewAuthService(db *gorm.DB, jwtSecret string) *AuthService {
	return &AuthService{db: db, jwtSecret: []byte(jwtSecret)}
}

// Login valida as credenciais e emite um token JWT assinado com HS256.
func (s *AuthService) Login(email, password string) (string, *models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, Unauthorized("usuário ou senha incorretos")
		}
		return "", nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, Unauthorized("usuário ou senha incorretos")
	}

	now := time.Now()
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(TokenTTL)),
		},
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
	if err != nil {
		return "", nil, err
	}
	return token, &user, nil
}

// Me retorna o usuário identificado pelo token.
func (s *AuthService) Me(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.Omit("password").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Usuário não encontrado")
		}
		return nil, err
	}
	return &user, nil
}

// CreateUser cadastra um usuário com a senha em hash BCrypt (RN07).
// A unicidade do e-mail é garantida pelo índice único: a violação é
// traduzida para conflito, sem janela de corrida (check-then-act).
func (s *AuthService) CreateUser(name, email, password, role string) (*models.User, error) {
	if role == "" {
		role = "user"
	}
	if role != "user" && role != "admin" {
		return nil, Invalid("papel inválido: use 'admin' ou 'user'")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := models.User{Name: name, Email: email, Password: string(hash), Role: role}
	if err := s.db.Create(&user).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, Conflict("Este e-mail já está cadastrado no sistema")
		}
		return nil, err
	}
	return &user, nil
}

// EnsureAdmin semeia o administrador padrão na primeira execução.
// Retorna true quando o usuário foi criado nesta chamada.
func (s *AuthService) EnsureAdmin(name, email, password string) (bool, error) {
	var count int64
	if err := s.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	if count > 0 {
		return false, nil
	}

	if _, err := s.CreateUser(name, email, password, "admin"); err != nil {
		// Outro processo pode ter semeado no mesmo instante.
		if errors.Is(err, ErrConflict) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
