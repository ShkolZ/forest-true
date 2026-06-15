-- name: GetAllOrders :many
SELECT * FROM orders;

-- name: GetOrderById :one
SELECT * FROM orders WHERE id = $1;

-- name: CreateOrder :one
INSERT INTO orders (id, title, status, excel_url, user_id, created_at, updated_at)
VALUES ($1,$3, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteOrderById :exec
DELETE FROM orders WHERE id = $1;

-- name: UpdateOrderById :one
UPDATE orders
SET status = $2, excel_url = $3, updated_at = $4
WHERE id = $1
RETURNING *;
