-- 0004: finished focus rounds from the Pomodoro timer (M5). One row = one "pomodoro".
-- A migration runs once, inside a transaction, and is then logged in schema_migrations.
-- Never edit this file after it is merged: write a new numbered file instead.

CREATE TABLE study_sessions (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Deleting a user deletes their study history too.
  user_id          integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- How long the focus round was. The same limits as the timer settings (1–90).
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 90),

  -- Optional ("SQL joins"). NULL when empty; never blank, never with spaces around it.
  topic            text CHECK (char_length(topic) BETWEEN 1 AND 40 AND topic = btrim(topic)),

  -- Set by the server, never by the browser: the browser's clock can be wrong (or faked).
  completed_at     timestamptz NOT NULL DEFAULT now(),

  -- The user's own calendar day when it finished, in THEIR time zone (users.time_zone).
  -- 11 pm in Adelaide is already "tomorrow" in UTC; this column keeps it on the right day.
  local_date       date NOT NULL
);

-- Every stats query asks "this user, these days", so we index exactly that.
CREATE INDEX study_sessions_user_date_idx ON study_sessions (user_id, local_date);
