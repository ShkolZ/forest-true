package main

import (
	"encoding/json"
	"net/http"
)

func (cfg *ApiConfig) handlerGetProducts(w http.ResponseWriter, r *http.Request) {

	products, err := cfg.db.GetAllProducts(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}

	data, err := json.Marshal(products)
	if err != nil {
		http.Error(w, "Failed to marshal products", http.StatusInternalServerError)
		return
	}

	w.Write(data)
	w.Header().Set("Content-Type", "application/json")

}

func (cfg *ApiConfig) handlerPostProducts(w http.ResponseWriter, r *http.Request) {

}
