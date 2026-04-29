CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);
