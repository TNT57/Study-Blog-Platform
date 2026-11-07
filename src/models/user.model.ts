// MODEL for users: the only place with SQL for the users table.
import { query } from "@/lib/db";

export type Role = "user" | "admin";

/** A user, the way the rest of the app sees it (camelCase). */
export type User = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  timeZone: string;
  createdAt: Date;
};

/** A row, the way Postgres sends it (snake_case). */
type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: Role;
  time_zone: string;
  created_at: Date;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    timeZone: row.time_zone,
    createdAt: row.created_at,
  };
}

export type NewUser = {
  username: string;
  email: string;
  passwordHash: string;
  timeZone: string;
  role?: Role;
};

export async function createUser(input: NewUser): Promise<User> {
  const rows = await query<UserRow>(
    `INSERT INTO users (username, email, password_hash, time_zone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, password_hash, role, time_zone, created_at`,
    [
      input.username,
      input.email,
      input.passwordHash,
      input.timeZone,
      input.role ?? "user",
    ],
  );
  return toUser(rows[0]);
}

/** Finds a user by email, ignoring upper/lower case. Returns null if there is none. */
export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await query<UserRow>(
    `SELECT id, username, email, password_hash, role, time_zone, created_at
     FROM users
     WHERE lower(email) = lower($1)`,
    [email],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function findUserById(id: number): Promise<User | null> {
  const rows = await query<UserRow>(
    `SELECT id, username, email, password_hash, role, time_zone, created_at
     FROM users
     WHERE id = $1`,
    [id],
  );
  return rows[0] ? toUser(rows[0]) : null;
}
