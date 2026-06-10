-- +goose Up

CREATE TABLE details (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    width INT NOT NULL,
    length INT NOT NULL,
    k_top BOOLEAN NOT NULL,
    k_left BOOLEAN NOT NULL,
    k_bottom BOOLEAN NOT NULL,
    k_right BOOLEAN NOT NULL,
    amount INT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- +goose Down
DROP TABLE details;
