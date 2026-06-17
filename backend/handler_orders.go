package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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
	v := r.Context().Value(authContextKey)
	authInfo, ok := v.(AuthInfo)
	if !ok {
		http.Error(w, "Wrong type", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	params := OrderParams{}
	err := decoder.Decode(&params)
	if err != nil {
		http.Error(w, "Couldn't parse r body", http.StatusBadRequest)
		return
	}

	excelPath, err := createExcel(params, cfg.db)
	tf, err := os.Open(excelPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Println(excelPath)

	defer os.Remove(tf.Name())
	defer tf.Close()

	rData := make([]byte, 16)
	rand.Read(rData)
	hexString := hex.EncodeToString(rData)

	key := fmt.Sprintf("%v/%v.xlsx", "excel", hexString)

	_, err = cfg.s3Client.PutObject(r.Context(), &s3.PutObjectInput{
		Bucket: cfg.s3PrivateBucket,
		Key:    &key,
		Body:   tf,
	})
	if err != nil {
		http.Error(w, "Couldn't save to bucket", http.StatusInternalServerError)
		log.Println(err.Error())
		return
	}

	url := fmt.Sprintf("%v/%v/%v/%v", cfg.domainName, "s3", *cfg.s3PrivateBucket, key)
	orderID, _ := uuid.NewUUID()

	order, err := cfg.db.CreateOrder(r.Context(), database.CreateOrderParams{
		ID:        orderID,
		Title:     params.Title,
		ExcelUrl:  url,
		UserID:    authInfo.UserID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})
	if err != nil {
		http.Error(w, "Couldn't create order", http.StatusInternalServerError)
		log.Println(err.Error())
		return
	}

	err = createOrderItems(params, cfg.db, orderID)
	if err != nil {
		http.Error(w, "Couldn't create order items", http.StatusInternalServerError)
		log.Println(err.Error())
		return
	}

	respondWithJson(w, http.StatusOK, order)

}

func (cfg *ApiConfig) handlerGetOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := cfg.db.GetAllOrdersWithUsername(r.Context())
	if err != nil {
		http.Error(w, "Couldn't get orders", http.StatusInternalServerError)
		log.Println(err)
		return
	}

	respondWithJson(w, http.StatusOK, orders)
}

func (cfg *ApiConfig) handlerDeleteOrder(w http.ResponseWriter, r *http.Request) {
	orderStringID := r.PathValue("ID")
	orderUUID, err := uuid.Parse(orderStringID)
	if err != nil {
		http.Error(w, "Could parse id", http.StatusBadRequest)
		return
	}

	err = cfg.db.DeleteOrderById(r.Context(), orderUUID)
	if err != nil {
		http.Error(w, "Couldn't delete order", http.StatusInternalServerError)
		log.Println(err.Error())
		return
	}
	respondWithJson(w, http.StatusNoContent, struct{}{})
}

func (cfg *ApiConfig) handlerGetOrderItems(w http.ResponseWriter, r *http.Request) {
	orderID, err := getPathValueUUID(r)
	if err != nil {
		http.Error(w, "Couldn't parse id", http.StatusBadRequest)
		return
	}

	orderItems, err := cfg.db.GetOrderItemsByOrderId(r.Context(), orderID)
	if err != nil {
		http.Error(w, "Couldn't get order items", http.StatusInternalServerError)
		log.Println(err)
		return
	}

	respondWithJson(w, http.StatusOK, orderItems)
}

func (cfg *ApiConfig) handlerDownloadExcel(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		http.Error(w, "Not admin", http.StatusUnauthorized)
		return
	}

	orderID, err := getPathValueUUID(r)
	if err != nil {
		http.Error(w, "Couldn't parse id", http.StatusBadRequest)
		return
	}

	type urlResponse struct {
		Url string `json:"url"`
	}

	order, err := cfg.db.GetOrderById(r.Context(), orderID)
	if err != nil {
		http.Error(w, "Couldn't get order", http.StatusInternalServerError)
		log.Println(err)
		return
	}
	split := strings.Split(order.ExcelUrl, fmt.Sprintf("%v/", *cfg.s3PrivateBucket))
	pc := s3.NewPresignClient(cfg.s3Client)
	req, err := pc.PresignGetObject(r.Context(), &s3.GetObjectInput{
		Bucket: cfg.s3PrivateBucket,
		Key:    &split[1],
	}, s3.WithPresignExpires(10*time.Minute))
	if err != nil {
		http.Error(w, "Couldn't sign the url", http.StatusInternalServerError)
		log.Println(err)
		return
	}

	res := urlResponse{
		Url: req.URL,
	}
	fmt.Println(res)

	respondWithJson(w, http.StatusOK, res)
}
