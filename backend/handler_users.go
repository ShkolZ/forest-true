package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/ShkolZ/forest-true/internal/auth"
	"github.com/ShkolZ/forest-true/internal/database"
	"github.com/google/uuid"
)

const (
	JWT_TOKEN_DURATION     time.Duration = 30 * time.Minute
	REFRESH_TOKEN_DURATION time.Duration = 2 * time.Hour
)

func (cfg *ApiConfig) handlerRegister(w http.ResponseWriter, r *http.Request) {
	v := r.Context().Value(authContextKey)
	authInfo, ok := v.(AuthInfo)
	if !ok {
		respondWithError(w, "Wrong type assertion", http.StatusInternalServerError, fmt.Errorf("Wrong type"))
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
		respondWithError(w, "You dont have admin role", http.StatusUnauthorized, fmt.Errorf("Wrong type"))
		return
	}

	decoder := json.NewDecoder(r.Body)

	var par params

	if err := decoder.Decode(&par); err != nil {
		respondWithError(w, "Couldn't decode", http.StatusBadRequest, fmt.Errorf("Wrong type"))
		return
	}

	hashedPassword, err := auth.HashPassword(par.Password)
	if err != nil {
		respondWithError(w, "Couldn't create password", http.StatusInternalServerError, fmt.Errorf("Wrong type"))
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
		respondWithError(w, "Couldn't create a user", http.StatusBadRequest, fmt.Errorf("Wrong type"))
		log.Println(err)
		return
	}

	respondWithJson(w, http.StatusCreated, newUser)
}

func (cfg *ApiConfig) handlerLogin(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	type resBody struct {
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	if err := decoder.Decode(&params); err != nil {
		respondWithError(w, "Couldn't decoder params", http.StatusBadRequest, err)
		return
	}

	user, err := cfg.db.GetUserByUsername(r.Context(), params.Username)
	if err != nil {
		respondWithError(w, "Couldn't get user by username", http.StatusUnauthorized, err)
		return
	}

	match, err := auth.CheckPasswordHash(params.Password, user.PasswordHash)
	if err != nil {
		fmt.Printf("test yaksho tyt proyob %v\n", err)
	}
	if !match {
		respondWithError(w, "Password did not match", http.StatusUnauthorized, err)
		return
	}

	jwtToken, err := auth.MakeJWT(user.ID, user.IsAdmin, cfg.tokenSecret, JWT_TOKEN_DURATION)
	if err != nil {
		respondWithError(w, "Couldn't make JWT", http.StatusUnauthorized, err)
		return
	}

	refreshToken, err := auth.MakeRefreshToken()
	if err != nil {
		respondWithError(w, "Couldn't create refresh token", http.StatusUnauthorized, err)
		return
	}

	_, err = cfg.db.CreateRefreshToken(r.Context(),
		database.CreateRefreshTokenParams{
			Token:     refreshToken,
			RevokedAt: time.Now().Add(REFRESH_TOKEN_DURATION),
			UserID:    user.ID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		})

	respondWithJson(w, 200, resBody{
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
		respondWithError(w, "Couldn't get users", http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusOK, users)
}

func (cfg *ApiConfig) handlerDeleteUser(w http.ResponseWriter, r *http.Request) {
	isAdmin, err := checkAdmin(r)
	if !isAdmin || err != nil {
		respondWithError(w, err.Error(), http.StatusUnauthorized, err)
		return
	}

	ID := r.PathValue("ID")
	id, err := uuid.Parse(ID)
	if err != nil {
		respondWithError(w, err.Error(), http.StatusBadRequest, err)
		return
	}

	err = cfg.db.DeleteUserById(r.Context(), id)
	if err != nil {
		respondWithError(w, err.Error(), http.StatusInternalServerError, err)
		return
	}

	respondWithJson(w, http.StatusNoContent, struct{}{})
}

func (cfg *ApiConfig) handlerRefreshToken(w http.ResponseWriter, r *http.Request) {

	decoder := json.NewDecoder(r.Body)

	type params struct {
		RefreshToken string `json:"refresh_token"`
	}
	reqBody := params{}
	decoder.Decode(&reqBody)

	refreshToken, err := cfg.db.GetRefreshToken(r.Context(), reqBody.RefreshToken)
	if err != nil {
		respondWithError(w, "No such refresh token", http.StatusUnauthorized, err)
		return
	}

	if time.Now().After(refreshToken.RevokedAt) {
		respondWithError(w, "Refresh token has expired", http.StatusUnauthorized, fmt.Errorf("refresh token expired"))
		return
	}

	user, err := cfg.db.GetUserById(r.Context(), refreshToken.UserID)
	if err != nil {
		respondWithError(w, "Couldn't get the user", http.StatusUnauthorized, err)
	}

	jwtToken, err := auth.MakeJWT(user.ID, user.IsAdmin, cfg.tokenSecret, JWT_TOKEN_DURATION)
	if err != nil {
		respondWithError(w, "Couldn't make JWT", http.StatusUnauthorized, err)
		return
	}

	newRefreshToken, err := auth.MakeRefreshToken()
	if err != nil {
		respondWithError(w, "Couldn't create refresh token", http.StatusUnauthorized, err)
		return
	}

	_, err = cfg.db.CreateRefreshToken(r.Context(), database.CreateRefreshTokenParams{
		Token:     newRefreshToken,
		RevokedAt: time.Now().Add(REFRESH_TOKEN_DURATION),
		UserID:    user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})
	if err != nil {
		respondWithError(w, "Couldn't add write refresh token to database", http.StatusUnauthorized, err)
		return
	}

	resBody := struct {
		RefreshToken string `json:"refresh_token"`
		JwtToken     string `json:"token"`
	}{
		RefreshToken: newRefreshToken,
		JwtToken:     jwtToken,
	}

	respondWithJson(w, http.StatusOK, resBody)
}
