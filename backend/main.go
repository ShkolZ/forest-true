package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func newS3Client(ctx context.Context, endpoint, accessKey, secretKey string) (*s3.Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("eu-north-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {

		return nil, err
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = &endpoint
		o.UsePathStyle = true
	})

	return client, nil
}

type ApiConfig struct {
	db              *database.Queries
	tokenSecret     string
	s3Client        *s3.Client
	s3PublicBucket  *string
	s3PrivateBucket *string
	domainName      string
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

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		log.Fatalln("Couldn't get s3 endpoint")
	}

	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	if accessKey == "" {
		log.Fatalln("Couldn't get access key")
	}

	secretKey := os.Getenv("MINIO_SECRET_KEY")
	if secretKey == "" {
		log.Fatalln("Couldn't get access key")
	}

	public := os.Getenv("PUBLIC_BUCKET")
	if public == "" {
		log.Fatalln("Couldn't get public bucket name")
	}

	private := os.Getenv("PRIVATE_BUCKET")
	if private == "" {
		log.Fatalln("Couldn't get private bucket name")
	}

	s3Client, err := newS3Client(context.Background(), endpoint, accessKey, secretKey)
	if err != nil {
		log.Fatalf("Couldn't create s3 client: %v\n")
	}

	domainName := os.Getenv("DOMAIN_NAME")
	if domainName == "" {
		log.Fatalln("Couldn't get domain name")
	}

	queries := database.New(conn)

	cfg := ApiConfig{
		db:              queries,
		tokenSecret:     tokenSecret,
		s3Client:        s3Client,
		s3PublicBucket:  &public,
		s3PrivateBucket: &private,
		domainName:      domainName,
	}

	mux := http.NewServeMux()

	// GET REQUESTS
	mux.HandleFunc("GET /api/products", cfg.handlerGetProducts)
	mux.HandleFunc("GET /api/users", cfg.AuthMiddleware(cfg.handlerGetUsers))
	mux.HandleFunc("GET /api/products/{ID}/details", cfg.handlerGetDetails)
	mux.HandleFunc("GET /api/me", cfg.AuthMiddleware(cfg.handlerMe))

	// POST REQUESTS
	mux.HandleFunc("POST /api/register", cfg.AuthMiddleware(cfg.handlerRegister))
	mux.HandleFunc("POST /api/login", cfg.handlerLogin)
	mux.HandleFunc("POST /api/details", cfg.AuthMiddleware(cfg.handlerPostDetails))
	mux.HandleFunc("POST /api/products", cfg.AuthMiddleware(cfg.handlerPostProducts))
	mux.HandleFunc("POST /api/orders", cfg.AuthMiddleware(cfg.handlerPostOrders))

	// DELETE REQUESTS
	mux.HandleFunc("DELETE /api/details/{ID}", cfg.AuthMiddleware(cfg.handlerDeleteDetail))
	mux.HandleFunc("DELETE /api/products/{ID}", cfg.AuthMiddleware(cfg.handlerDeleteProduct))
	mux.HandleFunc("DELETE /api/users/{ID}", cfg.AuthMiddleware(cfg.handlerDeleteUser))

	// PUT REQUESTS
	mux.HandleFunc("PUT /api/details/{ID}", cfg.AuthMiddleware(cfg.handlerPutDetail))

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: cfg.LoggingMiddleware(mux),
	}

	log.Printf("Server is started on http://localhost:%v", port)
	log.Fatalln(srv.ListenAndServe())
}
