package config

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/spf13/viper"
)

// Config reúne as variáveis de ambiente da aplicação.
type Config struct {
	DatabaseURL    string
	JWTSecret      string
	AdminEmail     string
	AdminPassword  string
	AdminName      string
	Port           string
	AppEnv         string
	AllowedOrigins []string
}

var defaultOrigins = []string{
	"http://localhost:5173",
	"https://frontend-ada.onrender.com",
}

// Load lê o arquivo .env (quando presente) e as variáveis de ambiente do
// sistema, validando as chaves obrigatórias antes de retornar — o servidor
// não sobe com configuração incompleta (ex.: JWT_SECRET vazio).
func Load() (*Config, error) {
	v := viper.New()
	v.SetConfigFile(".env")
	v.AutomaticEnv()

	for _, key := range []string{
		"DATABASE_URL", "JWT_SECRET", "PORT",
		"ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME",
		"APP_ENV", "ALLOWED_ORIGINS",
	} {
		_ = v.BindEnv(key)
	}

	if err := v.ReadInConfig(); err != nil {
		// O .env é opcional (em produção usa-se apenas o ambiente), mas um
		// arquivo existente e ilegível é erro de configuração, não silêncio.
		if _, statErr := os.Stat(".env"); statErr == nil {
			return nil, fmt.Errorf("falha ao ler .env: %w", err)
		}
	}

	cfg := &Config{
		DatabaseURL:   v.GetString("DATABASE_URL"),
		JWTSecret:     v.GetString("JWT_SECRET"),
		AdminEmail:    v.GetString("ADMIN_EMAIL"),
		AdminPassword: v.GetString("ADMIN_PASSWORD"),
		AdminName:     v.GetString("ADMIN_NAME"),
		Port:          v.GetString("PORT"),
		AppEnv:        v.GetString("APP_ENV"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.AppEnv == "" {
		cfg.AppEnv = "development"
	}

	if raw := v.GetString("ALLOWED_ORIGINS"); raw != "" {
		for _, origin := range strings.Split(raw, ",") {
			if o := strings.TrimSpace(origin); o != "" {
				cfg.AllowedOrigins = append(cfg.AllowedOrigins, o)
			}
		}
	} else {
		cfg.AllowedOrigins = defaultOrigins
	}

	var missing []string
	for key, value := range map[string]string{
		"DATABASE_URL":   cfg.DatabaseURL,
		"JWT_SECRET":     cfg.JWTSecret,
		"ADMIN_EMAIL":    cfg.AdminEmail,
		"ADMIN_PASSWORD": cfg.AdminPassword,
		"ADMIN_NAME":     cfg.AdminName,
	} {
		if value == "" {
			missing = append(missing, key)
		}
	}
	if len(missing) > 0 {
		sort.Strings(missing)
		return nil, fmt.Errorf("variáveis de ambiente obrigatórias ausentes: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}
