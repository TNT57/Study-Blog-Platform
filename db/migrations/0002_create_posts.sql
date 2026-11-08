-- 0002: the posts table.
-- A migration runs once, inside a transaction, and is then logged in schema_migrations.
-- Never edit this file after it is merged: write a new numbered file instead.

CREATE TABLE posts (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- The user who wrote the post. Deleting the user deletes their posts too.
  author_id  integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- 1–120 characters, and not only spaces (btrim of only spaces is '').
  title      text NOT NULL CHECK (char_length(title) <= 120 AND btrim(title) <> ''),

  -- 1–20 000 characters, and not only spaces.
  content    text NOT NULL CHECK (char_length(content) <= 20000 AND btrim(content) <> ''),

  created_at timestamptz NOT NULL DEFAULT now(),
  -- Every UPDATE in post.model.ts sets this to now().
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Makes "all posts by this user" fast, and deleting a user too (CASCADE must find their posts).
CREATE INDEX posts_author_id_idx ON posts (author_id);
