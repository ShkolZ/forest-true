-- name: GetAllDetails :many
SELECT * FROM details;

-- name: GetDetailById :one
SELECT * FROM details WHERE id = $1;

-- name: GetDetailsByProduct :many
SELECT * FROM details WHERE product_id = $1 ORDER BY created_at;

-- name: CreateDetail :one
INSERT INTO details (id, name, width, length, k_top, k_left, k_bottom, k_right, amount, product_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: DeleteDetailById :exec
DELETE FROM details WHERE id = $1;

-- name: UpdateDetailById :one
UPDATE details
SET name = $2, width = $3, length = $4, k_top = $5, k_left = $6, k_bottom = $7, k_right = $8, amount = $9, product_id = $10, updated_at = $11
WHERE id = $1
RETURNING *;
