-- +goose Up
CREATE TABLE
    refresh_tokens (
        token TEXT PRIMARY KEY,
        revoked_at TIMESTAMP NOT NULL,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );

-- +goose Down
DROP TABLE refresh_tokens;