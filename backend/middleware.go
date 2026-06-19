package main

import (
	"context"
	"log"
	"net/http"

	"github.com/ShkolZ/forest-true/internal/auth"
	"github.com/google/uuid"
)

type contextKey string

const authContextKey contextKey = "authInfo"

type AuthInfo struct {
	UserID  uuid.UUID
	IsAdmin bool
}

func (cfg *ApiConfig) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		token, err := auth.GetBearerToken(req.Header)
		if err != nil {
			respondWithError(w, err.Error(), http.StatusUnauthorized, err)
			return
		}

		userID, isAdmin, err := auth.ValidateJWT(token, cfg.tokenSecret)
		if err != nil {
			respondWithError(w, err.Error(), http.StatusUnauthorized, err)
			return
		}

		ctx := context.WithValue(req.Context(), authContextKey, AuthInfo{
			UserID:  userID,
			IsAdmin: isAdmin,
		})

		next.ServeHTTP(w, req.WithContext(ctx))
	})
}

func (cfg *ApiConfig) LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		log.Printf("%s %s", req.Method, req.URL.Path)

		next.ServeHTTP(w, req)
	})
}
