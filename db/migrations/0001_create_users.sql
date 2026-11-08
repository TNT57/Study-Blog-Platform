-- 0001: the users table.
-- A migration runs once, inside a transaction, and is then logged in schema_migrations.
-- Never edit this file after it is merged: write a new numbered file instead.

CREATE TABLE users (
  -- A number the database picks for us: 1, 2, 3...
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Shown on posts. 3–20 characters: letters, numbers and _ only.
  username      text NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),

  -- Used to log in. A light check only; Zod checks the full email format in the app.
  email         text NOT NULL CHECK (char_length(email) <= 254 AND email LIKE '%_@_%'),

  -- An Argon2id hash (from M3). Never the real password.
  password_hash text NOT NULL,

  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- The user's IANA time zone, like 'Australia/Adelaide', so stats know their "today".
  time_zone     text NOT NULL DEFAULT 'UTC',

  created_at    timestamptz NOT NULL DEFAULT now()
);

-- UNIQUE ignoring upper/lower case, so "Trung@Example.com" and "trung@example.com"
-- count as the same email, and "Trung" can't pretend to be "trung".
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
CREATE UNIQUE INDEX users_username_unique ON users (lower(username));
