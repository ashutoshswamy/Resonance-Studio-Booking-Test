-- Admin follow-up on new customers (Customers page). Name/number lock itself needs no schema change.
ALTER TABLE users ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
