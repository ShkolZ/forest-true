package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

const max_upload_size = 10 << 10

type resProduct struct {
	ID          uuid.UUID
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	ImageUrl    string
}

func (cfg *ApiConfig) handlerGetProducts(w http.ResponseWriter, r *http.Request) {

	products, err := cfg.db.GetAllProducts(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}

	fmt.Println(products)

	respondWithJson(w, 200, products)

}

func (cfg *ApiConfig) handlerPostProducts(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(max_upload_size)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	productName := r.FormValue("name")
	productDesc := r.FormValue("description")
	f, fh, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Counldn't get image from form", http.StatusBadRequest)
		fmt.Println(err.Error())
		return
	}

	mediaType := fh.Header.Get("Content-Type")
	fmt.Println(productDesc, productName, f, mediaType)
	split := strings.Split(mediaType, "/")

	if split[0] != "image" {
		http.Error(w, "Wrong file type", http.StatusBadRequest)
		return
	}

	tf, err := os.CreateTemp("", fmt.Sprintf("%v.%v", "temp", split[1]))
	if err != nil {
		http.Error(w, "Couldn't create temp file", http.StatusInternalServerError)
		return
	}

	io.Copy(tf, f)
	tf.Seek(0, io.SeekStart)

	defer os.Remove(tf.Name())
	defer tf.Close()

	rdata := make([]byte, 32)
	rand.Read(rdata)
	hexString := hex.EncodeToString(rdata)
	fmt.Println(tf.Stat())

	key := fmt.Sprintf("%v/%v.%v", "images", hexString, split[1])

	cfg.s3Client.PutObject(r.Context(), &s3.PutObjectInput{
		Bucket: cfg.s3PublicBucket,
		Key:    &key,
		Body:   tf,
	})

	url := fmt.Sprintf("%v/%v/%v/%v", cfg.domainName, "s3", *cfg.s3PublicBucket, key)
	fmt.Println(url)

	cusUuid, _ := uuid.NewUUID()

	product, err := cfg.db.CreateProduct(r.Context(), database.CreateProductParams{
		ID:          cusUuid,
		Name:        productName,
		Description: productDesc,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		ImageUrl:    url,
	})
	if err != nil {
		http.Error(w, "Couldn't create a product", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	respondWithJson(w, http.StatusOK, product)

}

func (cfg *ApiConfig) handlerDeleteProduct(w http.ResponseWriter, r *http.Request) {
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

	err = cfg.db.DeleteProductById(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusNoContent, struct{}{})
}
