-- name: GetAllProducts :many
SELECT * FROM products;

-- name: GetProductById :one
SELECT * FROM products WHERE id = $1;

-- name: CreateProduct :one
INSERT INTO products (id, name, description, image_url, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteProductById :exec
DELETE FROM products WHERE id = $1;

-- name: UpdateProductById :one
UPDATE products
SET name = $2, description = $3, image_url = $4, updated_at = $5
WHERE id = $1
RETURNING *;
