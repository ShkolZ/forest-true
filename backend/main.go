package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type ApiConfig struct {
	db          *database.Queries
	tokenSecret string
}

func main() {
	godotenv.Load(".env")

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatalln("Couldn't load port")
	}

	dbString := os.Getenv("DB_STRING")
	if dbString == "" {
		log.Fatalln("Couldn't load dbString")
	}

	tokenSecret := os.Getenv("JWT_SECRET")
	if tokenSecret == "" {
		log.Fatalln("Couldn't load jwt secret")
	}

	conn, err := sql.Open("postgres", dbString)
	if err != nil {
		log.Fatalln("Couldn't load dbString")
	}

	queries := database.New(conn)

	cfg := ApiConfig{
		db:          queries,
		tokenSecret: tokenSecret,
	}

	mux := http.NewServeMux()

	appHandler := http.StripPrefix("/frontend", http.FileServer(http.Dir("../frontend")))
	mux.Handle("/frontend/", appHandler)

	mux.HandleFunc("GET /api/products", cfg.handlerGetProducts)
	mux.HandleFunc("GET /api/details", cfg.handlerGetDetails)
	mux.HandleFunc("GET /api/me", cfg.AuthMiddleware(cfg.handlerMe))

	mux.HandleFunc("POST /api/register", cfg.AuthMiddleware(cfg.handlerRegister))
	mux.HandleFunc("POST /api/login", cfg.handlerLogin)
	mux.HandleFunc("POST /api/detail", cfg.AuthMiddleware(cfg.handlerPostDetails))
	mux.HandleFunc("POST /api/products", cfg.AuthMiddleware(cfg.handlerPostProducts))

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: cfg.LoggingMiddleware(mux),
	}

	log.Printf("Server is started on http://localhost:%v", port)
	log.Fatalln(srv.ListenAndServe())
}
