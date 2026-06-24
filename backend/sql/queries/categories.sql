-- name: GetAllCategories :many
SELECT * FROM categories;

-- name: GetCategoryById :one
SELECT * FROM categories
WHERE id = $1;

-- name: GetCategoryByName :one 
SELECT * FROM categories
WHERE title = $1;

-- name: CreateCategory :one
INSERT INTO categories (id, title, created_at) 
VALUES ($1, $2, $3)
RETURNING *;

