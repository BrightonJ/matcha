CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    visited_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(visitor_id, visited_id, viewed_at)
);
