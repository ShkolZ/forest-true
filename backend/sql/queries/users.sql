-- name: GetAllUsers :many
SELECT * FROM users;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1;

-- name: CreateUser :one
INSERT INTO users (id, username, password_hash, first_name, last_name,is_admin, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteUserById :exec
DELETE FROM users WHERE id = $1;

-- name: UpdateUserById :one
UPDATE users
SET username = $2, password_hash = $3, first_name = $4, last_name = $5, updated_at = $6
WHERE id = $1
RETURNING *;
