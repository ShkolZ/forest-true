package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

func respondWithJson(w http.ResponseWriter, status int, str any) {
	data, err := json.Marshal(str)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println(string(data))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(data)
}

func checkAdmin(r *http.Request) (bool, error) {
	v := r.Context().Value(authContextKey)
	authInfo, ok := v.(AuthInfo)
	if !ok {
		return false, fmt.Errorf("Wrong type assertion")
	}

	if !authInfo.IsAdmin {
		return false, fmt.Errorf("Not admin")
	}
	return true, nil
}

func createExcel(params OrderParams, db *database.Queries) (string, error) {
	rData := make([]byte, 32)
	rand.Read(rData)
	hexString := hex.EncodeToString(rData)

	f := excelize.NewFile()
	defer f.Close()
	sheet := "Sheet1"
	err := f.SetSheetRow(sheet, "A1", &[]any{"Матеріал", "Довжина", "Ширина", "Кількість", "Текстура", "Найменування", "ОВ", "ОН", "ОЛ", "ОП", "Опис"})
	if err != nil {
		return "", nil
	}

	row := 2
	for _, item := range params.Items {
		pId, err := uuid.Parse(item.ProductID)
		if err != nil {
			return "", err
		}
		product, err := db.GetProductById(context.Background(), pId)
		if err != nil {
			return "", err
		}
		parts, err := db.GetDetailsByProduct(context.Background(), pId)
		if err != nil {
			return "", err
		}
		fmt.Println(parts)
		for range item.Quantity {

			for _, part := range parts {
				err := f.SetSheetRow(
					sheet,
					fmt.Sprintf("A%v", row),
					&[]any{part.Name, part.Length, part.Width, part.Amount, 0, 0, part.KTop, part.KBottom, part.KLeft, part.KRight, product.Name})
				if err != nil {
				}
				fmt.Println(err)
				row++
			}
		}
	}

	err = f.SaveAs(fmt.Sprintf("%v/%v.xlsx", "/home/shkolz", hexString))
	if err != nil {
	}
	// for _, item := range params.Items {

	// }
	return "", nil
}
