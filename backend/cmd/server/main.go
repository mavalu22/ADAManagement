package main

import (
	"log/slog"
	"os"

	"adamanagement/backend/internal/app"
)

func main() {
	if err := app.Run(); err != nil {
		slog.Error("erro fatal", "error", err)
		os.Exit(1)
	}
}
