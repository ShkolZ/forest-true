-- +goose Up

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    status TEXT NOT NULL,
    excel_url TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE orders;
