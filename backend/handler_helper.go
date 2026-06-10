package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
