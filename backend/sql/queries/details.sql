-- name: GetAllDetails :many
SELECT * FROM details;

-- name: GetDetailById :one
SELECT * FROM details WHERE id = $1;

-- name: CreateDetail :one
INSERT INTO details (id, name, width, length, amount, product_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteDetailById :exec
DELETE FROM details WHERE id = $1;

-- name: UpdateDetailById :one
UPDATE details
SET name = $2, width = $3, length = $4, amount = $5, product_id = $6, updated_at = $7
WHERE id = $1
RETURNING *;
