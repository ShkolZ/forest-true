-- name: GetAllOrderItems :many
SELECT * FROM order_items;

-- name: GetOrderItemById :one
SELECT * FROM order_items WHERE id = $1;

-- name: GetOrderItemsByOrderId :many
SELECT order_items.*, products.name AS product_name, products.image_url AS product_image_url
FROM order_items
JOIN products ON order_items.product_id = products.id
WHERE order_items.order_id = $1
ORDER BY order_items.created_at DESC;


-- name: CreateOrderItem :one
INSERT INTO order_items (id, quantity, order_id, product_id, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
