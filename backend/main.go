package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

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

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/products")
	mux.HandleFunc("GET /api/details")

	mux.HandleFunc("POST /api/register")
	mux.HandleFunc("POST /api/login")
	mux.HandleFunc("POST /api/detail")
	mux.HandleFunc("POST /api/products")

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Server is started on http://localhost:%v", port)
	log.Fatalln(srv.ListenAndServe())
}
