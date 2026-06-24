package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/aws/aws-sdk-go-v2/aws"
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
	if categoryParam := r.URL.Query().Get("category"); categoryParam != "" {
		products, err := cfg.db.GetProductsByCategoryName(r.Context(), categoryParam)
		if err != nil {
			respondWithError(w, "Failed to fetch products", http.StatusInternalServerError, err)
			return
		}

		respondWithJson(w, http.StatusOK, products)
		return
	}

	products, err := cfg.db.GetAllProducts(r.Context())
	if err != nil {
		respondWithError(w, "Failed to fetch products", http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusOK, products)

}

func (cfg *ApiConfig) handlerPostProducts(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(max_upload_size)
	if err != nil {
		respondWithError(w, err.Error(), http.StatusBadRequest, err)
		return
	}

	productName := r.FormValue("name")
	productDesc := r.FormValue("description")
	categoryStringID := r.FormValue("category_id")
	categoryID, err := uuid.Parse(categoryStringID)
	if err != nil {
		respondWithError(w, "Couldn't parse id", http.StatusBadRequest, err)
		return
	}
	f, fh, err := r.FormFile("image")
	if err != nil {
		respondWithError(w, "Counldn't get image from form", http.StatusBadRequest, err)
		log.Println(err.Error())
		return
	}

	mediaType := fh.Header.Get("Content-Type")
	split := strings.Split(mediaType, "/")

	if split[0] != "image" {
		respondWithError(w, "Wrong file type", http.StatusBadRequest, fmt.Errorf("Wrong file type"))
		return
	}

	tf, err := os.CreateTemp("", fmt.Sprintf("%v.%v", "temp", split[1]))
	if err != nil {
		respondWithError(w, "Couldn't create temp file", http.StatusInternalServerError, err)
		return
	}

	io.Copy(tf, f)
	tf.Seek(0, io.SeekStart)

	defer os.Remove(tf.Name())
	defer tf.Close()

	rdata := make([]byte, 32)
	rand.Read(rdata)
	hexString := hex.EncodeToString(rdata)

	key := fmt.Sprintf("%v/%v.%v", "images", hexString, split[1])

	cfg.s3Client.PutObject(r.Context(), &s3.PutObjectInput{
		Bucket: cfg.s3PublicBucket,
		Key:    &key,
		Body:   tf,
	})

	url := fmt.Sprintf("%v/%v/%v/%v", cfg.domainName, "s3", *cfg.s3PublicBucket, key)

	cusUuid, _ := uuid.NewUUID()

	product, err := cfg.db.CreateProduct(r.Context(), database.CreateProductParams{
		ID:          cusUuid,
		Name:        productName,
		Description: productDesc,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		ImageUrl:    url,
		CategoryID:  categoryID,
	})
	if err != nil {
		respondWithError(w, "Couldn't create a product", http.StatusInternalServerError, err)
		log.Println(err)
		return
	}

	respondWithJson(w, http.StatusOK, product)

}

func (cfg *ApiConfig) handlerDeleteProduct(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		respondWithError(w, err.Error(), http.StatusUnauthorized, err)
		return
	}

	productId, err := getPathValueUUID(r)
	if err != nil {
		respondWithError(w, "Couldn't parse uuid", http.StatusBadRequest, err)
		return
	}

	product, err := cfg.db.GetProductById(r.Context(), productId)
	if err != nil {
		respondWithError(w, "Couldn't get product", http.StatusInternalServerError, err)
		return
	}

	err = cfg.db.DeleteProductById(r.Context(), productId)
	if err != nil {
		respondWithError(w, "Couldn't delete product", http.StatusInternalServerError, err)
		return
	}

	key := strings.Split(product.ImageUrl, *cfg.s3PublicBucket+"/")[1]
	fmt.Println(key)
	_, err = cfg.s3Client.DeleteObject(r.Context(), &s3.DeleteObjectInput{
		Bucket: cfg.s3PublicBucket,
		Key:    aws.String(key),
	})
	if err != nil {
		respondWithError(w, "Couldn't delete object from bucket", http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusNoContent, struct{}{})
}
