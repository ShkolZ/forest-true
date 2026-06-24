package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
)

func (cfg *ApiConfig) handlerGetCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := cfg.db.GetAllCategories(r.Context())
	if err != nil {
		respondWithError(w, "Couldn't get categories", http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusOK, categories)
}

func (cfg *ApiConfig) handlerPostCategories(w http.ResponseWriter, r *http.Request) {
	type params struct {
		CategoryName string `json:"title"`
	}

	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		respondWithError(w, "Not Authorized", http.StatusUnauthorized, err)
		return
	}

	decoder := json.NewDecoder(r.Body)
	reqBody := params{}
	decoder.Decode(&reqBody)

	categoryID, _ := uuid.NewUUID()

	category, err := cfg.db.CreateCategory(r.Context(), database.CreateCategoryParams{
		ID:        categoryID,
		Title:     reqBody.CategoryName,
		CreatedAt: time.Now(),
	})
	if err != nil {
		respondWithError(w, "Couldn't create a category", http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusOK, category)
}
