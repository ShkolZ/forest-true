package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

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
	log.Println("\033[32mSuccessful response\033[0m")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(data)
}

func respondWithError(w http.ResponseWriter, msg string, status int, err error) {
	http.Error(w, msg, status)
	log.Printf("\033[31mError Occured: %v\033[0m\n", err)
	return
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
	err := f.SetSheetRow(sheet, "A1", &[]any{"Деталь", "Довжина", "Ширина", "Кількість", "Текстура", "ОВ", "ОН", "ОЛ", "ОП"})
	if err != nil {
		return "", nil
	}

	row := 2
	for _, item := range params.Items {
		pId, err := uuid.Parse(item.ProductID)
		if err != nil {
			return "", err
		}
		// product, err := db.GetProductById(context.Background(), pId)
		// if err != nil {
		// 	return "", err
		// }
		parts, err := db.GetDetailsByProduct(context.Background(), pId)
		if err != nil {
			return "", err
		}
		for range item.Quantity {
			for _, part := range parts {
				err := f.SetSheetRow(
					sheet,
					fmt.Sprintf("A%v", row),
					&[]any{part.Name, part.Length, part.Width, part.Amount, 1, btoi(part.KTop), btoi(part.KBottom), btoi(part.KLeft), btoi(part.KRight)})
				if err != nil {
					return "", err
				}

				row++
			}
		}
	}

	excelPath := fmt.Sprintf("%v/%v.xlsx", "/tmp", hexString)
	err = f.SaveAs(excelPath)
	if err != nil {
		return "", err
	}

	return excelPath, nil
}

func createOrderItems(params OrderParams, db *database.Queries, orderID uuid.UUID) error {
	for _, item := range params.Items {
		itemID, _ := uuid.NewUUID()
		productUUID, _ := uuid.Parse(item.ProductID)
		_, err := db.CreateOrderItem(context.Background(), database.CreateOrderItemParams{
			ID:        itemID,
			Quantity:  int32(item.Quantity),
			OrderID:   orderID,
			ProductID: productUUID,
			CreatedAt: time.Now(),
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func getPathValueUUID(r *http.Request) (uuid.UUID, error) {
	orderStringID := r.PathValue("ID")
	orderID, err := uuid.Parse(orderStringID)
	if err != nil {
		return uuid.UUID{}, err
	}
	return orderID, nil
}

func btoi(b bool) int {
	if b {
		return 1
	}
	return 0
}
