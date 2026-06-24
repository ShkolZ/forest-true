-- +goose Up

ALTER TABLE products
ADD category_id UUID NOT NULL,
ADD CONSTRAINT fk_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE CASCADE;

-- +goose Down
ALTER TABLE products
DROP COLUMN category_id;