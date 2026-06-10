package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
)

func (cfg *ApiConfig) handlerGetDetails(w http.ResponseWriter, r *http.Request) {
	ID := r.PathValue("ID")

	id, err := uuid.Parse(ID)
	if err != nil {
		http.Error(w, "Couldn't parse uuid", http.StatusBadRequest)
		return
	}

	parts, err := cfg.db.GetDetailsByProduct(r.Context(), id)
	if err != nil {
		http.Error(w, "Couldn't get parts", http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusOK, parts)
}

func (cfg *ApiConfig) handlerPostDetails(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var params database.CreateDetailParams
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	id, _ := uuid.NewUUID()
	params.ID = id
	params.CreatedAt = time.Now()
	params.UpdatedAt = time.Now()

	part, err := cfg.db.CreateDetail(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusOK, part)
	log.Printf("Part: %v was created", params.ID)
}

func (cfg *ApiConfig) handlerDeleteDetail(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ID := r.PathValue("ID")
	id, err := uuid.Parse(ID)
	if err != nil {
		http.Error(w, "Couldn't parse uuid", http.StatusBadRequest)
		return
	}

	err = cfg.db.DeleteDetailById(r.Context(), id)
	if err != nil {
		http.Error(w, "Couldn't delete the part", http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusNoContent, struct{}{})
	log.Printf("Part %v was deleted", id)
}

func (cfg *ApiConfig) handlerPutDetail(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ID := r.PathValue("ID")
	id, err := uuid.Parse(ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	params := database.UpdateDetailByIdParams{}
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&params); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println(params, id)

	// part, err := cfg.db.UpdateDetailById(r.Context(), )
}
