// Checks the rules of the posts table (db/migrations/0002_create_posts.sql).
// Task 1 of the M1 pair tasks: see docs/learn/01-database.md.
import { describe, expect, it } from "vitest";

import { query } from "@/lib/db";

import { expectDbError, makeUser } from "./helpers";

async function insertPost(
  authorId: number,
  title: string,
  content = "Some content.",
) {
  return query<{ id: number; created_at: Date; updated_at: Date }>(
    `INSERT INTO posts (author_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING id, created_at, updated_at`,
    [authorId, title, content],
  );
}

describe("posts table (Task 1)", () => {
  it("exists", async () => {
    const rows = await query<{ name: string | null }>(
      "SELECT to_regclass('public.posts')::text AS name",
    );
    expect(
      rows[0].name,
      "Task 1: create db/migrations/0002_create_posts.sql",
    ).toBe("posts");
  });

  it("saves a valid post, with a number id and both dates filled in", async () => {
    const author = await makeUser();

    const [post] = await insertPost(author.id, "SQL joins explained");

    expect(post.id).toBeTypeOf("number");
    expect(post.created_at).toBeInstanceOf(Date);
    expect(post.updated_at).toBeInstanceOf(Date);
  });

  it.each(["", "   "])('rejects the empty title "%s"', async (title) => {
    const author = await makeUser();

    expect(await expectDbError(() => insertPost(author.id, title))).toBe(
      "23514",
    );
  });

  it("accepts a 120-character title but rejects 121 characters", async () => {
    const author = await makeUser();

    await expect(insertPost(author.id, "a".repeat(120))).resolves.toHaveLength(
      1,
    );
    const code = await expectDbError(() =>
      insertPost(author.id, "a".repeat(121)),
    );
    // 23514 = CHECK rule failed, 22001 = text too long for varchar(120). Both are fine.
    expect(["23514", "22001"]).toContain(code);
  });

  it("deletes a user's posts when the user is deleted", async () => {
    const author = await makeUser();
    await insertPost(author.id, "First post");
    await insertPost(author.id, "Second post");

    await query("DELETE FROM users WHERE id = $1", [author.id]);

    const rows = await query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM posts WHERE author_id = $1",
      [author.id],
    );
    expect(rows[0].count).toBe(0);
  });
});
