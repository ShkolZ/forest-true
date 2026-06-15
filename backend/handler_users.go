package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ShkolZ/forest-true/internal/auth"
	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
)

func (cfg *ApiConfig) handlerRegister(w http.ResponseWriter, r *http.Request) {
	v := r.Context().Value(authContextKey)
	authInfo, ok := v.(AuthInfo)
	if !ok {
		http.Error(w, "Wrong type assertion", http.StatusInternalServerError)
		return
	}

	type params struct {
		Username  string `json:"username"`
		Password  string `json:"password"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		IsAdmin   bool   `json:"is_admin"`
	}

	if !authInfo.IsAdmin {
		http.Error(w, "You dont have admin role", http.StatusUnauthorized)
		return
	}

	decoder := json.NewDecoder(r.Body)

	var par params

	if err := decoder.Decode(&par); err != nil {
		http.Error(w, "Couldn't decode", http.StatusBadRequest)
		return
	}

	hashedPassword, err := auth.HashPassword(par.Password)
	if err != nil {
		http.Error(w, "Couldn't create password", http.StatusInternalServerError)
		return
	}

	newUser, err := cfg.db.CreateUser(r.Context(), database.CreateUserParams{
		ID:           uuid.New(),
		Username:     par.Username,
		PasswordHash: hashedPassword,
		FirstName:    par.FirstName,
		LastName:     par.LastName,
		IsAdmin:      par.IsAdmin,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	})
	if err != nil {
		http.Error(w, "Couldn't create a user", http.StatusBadRequest)
		fmt.Println(err)
		return
	}

	respondWithJson(w, http.StatusCreated, newUser)
}

func (cfg *ApiConfig) handlerLogin(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	type response struct {
		database.User
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	if err := decoder.Decode(&params); err != nil {
		http.Error(w, "Couldn't decoder params", http.StatusBadRequest)
		return
	}

	user, err := cfg.db.GetUserByUsername(r.Context(), params.Username)
	if err != nil {
		http.Error(w, "Couldn't get user by username", http.StatusUnauthorized)
		return
	}

	match, err := auth.CheckPasswordHash(params.Password, user.PasswordHash)
	if err != nil {
		fmt.Printf("test yaksho tyt proyob %v\n", err)
	}
	if !match {
		http.Error(w, "Password did not match", http.StatusUnauthorized)
		return
	}

	fmt.Println(user.IsAdmin)

	jwtToken, err := auth.MakeJWT(user.ID, user.IsAdmin, cfg.tokenSecret, time.Minute*30)
	if err != nil {
		http.Error(w, "Couldn't make JWT", http.StatusUnauthorized)
		return
	}

	refreshToken, err := auth.MakeRefreshToken()
	if err != nil {
		http.Error(w, "Couldn't create refresh token", http.StatusUnauthorized)
		return
	}

	_, err = cfg.db.CreateRefreshToken(r.Context(),
		database.CreateRefreshTokenParams{
			Token:     refreshToken,
			RevokedAt: time.Now().Add(time.Hour * 2),
			UserID:    user.ID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		})

	respondWithJson(w, 200, response{
		User:         user,
		Token:        jwtToken,
		RefreshToken: refreshToken,
	})

}

func (cfg *ApiConfig) handlerMe(w http.ResponseWriter, r *http.Request) {
	respondWithJson(w, http.StatusOK, struct{}{})
}

func (cfg *ApiConfig) handlerGetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := cfg.db.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Couldn't get users", http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusOK, users)
}

func (cfg *ApiConfig) handlerDeleteUser(w http.ResponseWriter, r *http.Request) {
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

	err = cfg.db.DeleteUserById(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondWithJson(w, http.StatusNoContent, struct{}{})
}
