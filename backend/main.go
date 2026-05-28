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

	mux.HandleFunc("GET /api/products", handlerGetProducts)
	mux.HandleFunc("GET /api/details", handlerGetDetails)

	mux.HandleFunc("POST /api/register", handlerRegister)
	mux.HandleFunc("POST /api/login", handlerLogin)
	mux.HandleFunc("POST /api/detail", handlerPostDetails)
	mux.HandleFunc("POST /api/products", handlerPostProducts)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Server is started on http://localhost:%v", port)
	log.Fatalln(srv.ListenAndServe())
}
