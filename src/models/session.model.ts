// MODEL for login sessions: the only place with SQL for the sessions table.
import { query } from "@/lib/db";
import type { Role } from "@/models/user.model";

/** The logged-in user, as found through a valid session. */
export type SessionUser = {
  id: number;
  username: string;
  role: Role;
  timeZone: string;
};

export async function createSession(input: {
  id: string;
  userId: number;
  expiresAt: Date;
}): Promise<void> {
  await query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [input.id, input.userId, input.expiresAt],
  );
}

/**
 * The user of a session that exists AND hasn't expired, or null.
 * The time check happens in SQL, with the database's clock.
 */
export async function findSessionUser(
  sessionId: string,
): Promise<SessionUser | null> {
  const rows = await query<{
    id: number;
    username: string;
    role: Role;
    time_zone: string;
  }>(
    `SELECT u.id, u.username, u.role, u.time_zone
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId],
  );
  const row = rows[0];
  return row
    ? {
        id: row.id,
        username: row.username,
        role: row.role,
        timeZone: row.time_zone,
      }
    : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

/** Housekeeping on every login: old sessions of this user are deleted. */
export async function deleteExpiredSessions(userId: number): Promise<void> {
  await query(
    "DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()",
    [userId],
  );
}
