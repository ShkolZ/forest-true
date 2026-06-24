-- +goose Up
CREATE TABLE categories(
    id UUID PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE categories;