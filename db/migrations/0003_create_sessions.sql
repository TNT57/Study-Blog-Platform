-- 0003: login sessions (M3).
-- A migration runs once, inside a transaction, and is then logged in schema_migrations.
-- Never edit this file after it is merged: write a new numbered file instead.

CREATE TABLE sessions (
  -- The SHA-256 of the random token in the login cookie, as 64 hex characters.
  -- The token itself is never stored: a leaked database can't log anyone in.
  id         text PRIMARY KEY CHECK (char_length(id) = 64),

  -- Deleting a user logs them out everywhere.
  user_id    integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- Fixed: 30 days after login. An expired session counts as logged out.
  expires_at timestamptz NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Makes "all sessions of this user" fast (cleaning up old sessions, deleting a user).
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
