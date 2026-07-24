package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"adamanagement/backend/internal/models"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService { return &UserService{db: db} }

type UserListFilter struct {
	Name  string
	Email string
	Role  string
}

func (s *UserService) List(f UserListFilter) ([]models.User, error) {
	q := s.db.Model(&models.User{})
	if f.Name != "" {
		q = q.Where("name LIKE ?", "%"+f.Name+"%")
	}
	if f.Email != "" {
		q = q.Where("email LIKE ?", "%"+f.Email+"%")
	}
	if f.Role != "" {
		q = q.Where("role = ?", f.Role)
	}

	var users []models.User
	if err := q.Omit("password").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

type UserUpdateInput struct {
	Name     string
	Email    string
	Password string
	Role     string
}

// Update aplica as regras de edição: um usuário comum só edita a si
// mesmo e não altera papel; o Admin Master (ID = 1) não pode ser
// rebaixado (RN01).
func (s *UserService) Update(requesterID uint, requesterRole string, targetID uint, in UserUpdateInput) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, targetID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, NotFound("Usuário não encontrado")
		}
		return nil, err
	}

	if requesterRole != "admin" && user.ID != requesterID {
		return nil, Forbidden("Sem permissão")
	}

	if in.Name != "" {
		user.Name = in.Name
	}
	if in.Email != "" {
		user.Email = in.Email
	}
	if in.Password != "" {
		if len(in.Password) < 6 {
			return nil, Invalid("A senha deve ter pelo menos 6 caracteres")
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hash)
	}
	if in.Role != "" && requesterRole == "admin" {
		if in.Role != "user" && in.Role != "admin" {
			return nil, Invalid("papel inválido: use 'admin' ou 'user'")
		}
		if user.ID == 1 && in.Role != "admin" {
			return nil, Forbidden("O Admin Principal não pode ser rebaixado.")
		}
		user.Role = in.Role
	}

	if err := s.db.Save(&user).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, Conflict("Este e-mail já está em uso por outro usuário")
		}
		return nil, err
	}
	return &user, nil
}

// Delete remove o usuário em definitivo (hard delete): o e-mail tem
// índice único e uma exclusão lógica impediria recadastrá-lo depois.
func (s *UserService) Delete(requesterID, targetID uint) error {
	var user models.User
	if err := s.db.First(&user, targetID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return NotFound("Usuário não encontrado")
		}
		return err
	}

	if user.ID == 1 {
		return Forbidden("O Admin Principal não pode ser excluído.")
	}
	if user.ID == requesterID {
		return Invalid("Você não pode deletar a si mesmo.")
	}

	return s.db.Unscoped().Delete(&user).Error
}
