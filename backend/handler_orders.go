package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
)

type OrderParams struct {
	Title string `json:"title"`
	Items []struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
	} `json:"items"`
}

func (cfg *ApiConfig) handlerPostOrders(w http.ResponseWriter, r *http.Request) {

	decoder := json.NewDecoder(r.Body)
	params := OrderParams{}
	err := decoder.Decode(&params)
	if err != nil {
		http.Error(w, "Couldn't parse r body", http.StatusBadRequest)
		return
	}

	excelUrl, err := createExcel(params, cfg.db)
	fmt.Println(excelUrl)
	fmt.Println(err)
	return
	orderID, _ := uuid.NewUUID()
	cfg.db.CreateOrder(r.Context(), database.CreateOrderParams{
		ID:    orderID,
		Title: params.Title,
	})

	fmt.Println(params)

}
