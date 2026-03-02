package services

import (
	"adamanagement/backend/config"
	"adamanagement/backend/internal/models"
	"adamanagement/backend/pkg/database"
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func Login(email, password string) (string, *models.User, error) {
	var user models.User

	if result := database.DB.Where("email = ?", email).First(&user); result.Error != nil {
		return "", nil, errors.New("usuário ou senha incorretos")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, errors.New("usuário ou senha incorretos")
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))

	return tokenString, &user, err
}

func CreateUser(name, email, password, role string) error {
	var existingUser models.User
	if result := database.DB.Where("email = ?", email).First(&existingUser); result.Error == nil {
		return errors.New("Este e-mail já está cadastrado no sistema")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if role == "" {
		role = "user"
	}

	user := models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
		Role:     role,
	}

	return database.DB.Create(&user).Error
}

func EnsureAdmin() {
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", config.AppConfig.AdminEmail).Count(&count)

	if count == 0 {
		err := CreateUser(config.AppConfig.AdminName, config.AppConfig.AdminEmail, config.AppConfig.AdminPassword, "admin")
		if err != nil {
			log.Printf("Erro ao criar admin: %v", err)
		} else {
			log.Println("✅ Admin padrão criado com role 'admin'")
		}
	}
}
