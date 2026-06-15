-- +goose Up

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    excel_url TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE orders;
