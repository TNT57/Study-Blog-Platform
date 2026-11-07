-- 0002: the posts table.

CREATE TABLE posts (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- copy the id line from users

  author_id  integer NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- must point to users (id), and is deleted with the user

  title      text NOT NULL CHECK (char_length(title) <= 120 AND btrim(title) <> ''), -- 1–120 characters, not only spaces

  content    text NOT NULL CHECK (char_length(content) <= 20000 AND btrim(content) <> ''), -- 1–20 000 characters, not only spaces

  created_at timestamptz NOT NULL DEFAULT now(), 
  updated_at  timestamptz NOT NULL DEFAULT now() 
);

-- An index on author_id makes "all posts by this user" fast.
CREATE INDEX posts_author_id_idx ON posts (author_id);
