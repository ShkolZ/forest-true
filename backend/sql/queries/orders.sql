-- name: GetAllOrders :many
SELECT * FROM orders;

-- name: GetOrderById :one
SELECT * FROM orders WHERE id = $1;

-- name: GetAllOrdersWithUsername :many
SELECT users.username, orders.*
FROM orders
JOIN users ON orders.user_id = users.id
ORDER BY orders.created_at DESC;

-- name: CreateOrder :one
INSERT INTO orders (id, title, excel_url, user_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteOrderById :exec
DELETE FROM orders WHERE id = $1;

-- name: UpdateOrderById :one
UPDATE orders
SET title = $2, excel_url = $3, updated_at = $4
WHERE id = $1
RETURNING *;
