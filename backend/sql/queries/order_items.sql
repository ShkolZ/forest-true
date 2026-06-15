-- name: GetAllOrderItems :many
SELECT * FROM order_items;

-- name: GetOrderItemById :one
SELECT * FROM order_items WHERE id = $1;

-- name: GetOrderItemsByOrderId :many
SELECT * FROM order_items WHERE order_id = $1;

-- name: CreateOrderItem :one
INSERT INTO order_items (id, quantity, order_id, product_id, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
