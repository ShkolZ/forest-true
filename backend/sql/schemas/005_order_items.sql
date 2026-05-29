-- +goose Up
CREATE TABLE
    order_items (
        id UUID PRIMARY KEY,
        quantity INT NOT NULL,
        order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL
    );

-- +goose Down
DROP TABLE order_items;