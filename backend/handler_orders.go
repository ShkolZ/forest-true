package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func (cfg *ApiConfig) handlerPostOrders(w http.ResponseWriter, r *http.Request) {
	type orderParams struct {
		Items []struct {
			ProductID string `json:"product_id"`
			Quantity  int    `json:"quantity"`
		} `json:"items"`
	}

	decoder := json.NewDecoder(r.Body)
	params := orderParams{}
	err := decoder.Decode(&params)
	if err != nil {
		http.Error(w, "Couldn't parse r body", http.StatusBadRequest)
		return
	}

	fmt.Println(params)

}
