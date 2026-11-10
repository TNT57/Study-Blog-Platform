# Migrations

Each `.sql` file here changes the database structure. `pnpm db:migrate` runs the new ones, in name order,
and writes each finished file in the `schema_migrations` table (the "log book").

## Rules

1. **Name:** 4 digits, then what it does, for example `0003_create_sessions.sql`.
2. **Never edit a migration after it is merged.** Other databases (CI, production) have already run it,
   and they will never run it again. Write a new file instead.
3. **Expand, then contract.** Add the new thing first (a new column), and remove the old thing in a
   _later_ deploy. During a deploy, the old code briefly runs on the new database.
4. **Before it's merged**, you may edit your own new file. Then run `pnpm db:reset` to rebuild your
   local database from zero.

## Files

| File                       | Milestone | What it does                               |
| -------------------------- | --------- | ------------------------------------------ |
| `0001_create_users.sql`    | M1        | The `users` table                          |
| `0002_create_posts.sql`    | M1        | The `posts` table                          |
| `0003_create_sessions.sql` | M3        | Login sessions (the SHA-256 of each token) |
| `0004_create_study_...`    | M5        | Pomodoro sessions (later)                  |
