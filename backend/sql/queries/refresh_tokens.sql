-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (token, revoked_at, user_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens
WHERE token = $1;