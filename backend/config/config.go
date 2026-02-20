package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	DatabaseURL   string `mapstructure:"DATABASE_URL"`
	JWTSecret     string `mapstructure:"JWT_SECRET"`
	AdminEmail    string `mapstructure:"ADMIN_EMAIL"`
	AdminPassword string `mapstructure:"ADMIN_PASSWORD"`
	AdminName     string `mapstructure:"ADMIN_NAME"`
	Port          string `mapstructure:"PORT"`
}

var AppConfig *Config

func LoadConfig() {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	_ = viper.BindEnv("DATABASE_URL")
	_ = viper.BindEnv("JWT_SECRET")
	_ = viper.BindEnv("PORT")
	_ = viper.BindEnv("ADMIN_EMAIL")
	_ = viper.BindEnv("ADMIN_PASSWORD")
	_ = viper.BindEnv("ADMIN_NAME")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("Aviso: Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.")
		} else {
			log.Println("Aviso: Erro ao ler .env:", err)
		}
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		log.Fatal("Erro crítico ao carregar configurações: ", err)
	}
}
