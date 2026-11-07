// MODEL for posts: the only place with SQL for the posts table.
import { query } from "@/lib/db";

export type Post = {
  id: number;
  authorId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A post plus its author's username (for the post list). */
export type PostWithAuthor = Post & { authorUsername: string };

type PostRow = {
  id: number;
  author_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
};

/** Turns a Postgres row (snake_case) into a Post (camelCase). */
function toPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type NewPost = { authorId: number; title: string; content: string };

export async function createPost(input: NewPost): Promise<Post> {
  const rows = await query<PostRow>(
    `INSERT INTO posts (author_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING id, author_id, title, content, created_at, updated_at`,
    [input.authorId, input.title, input.content],
  );
  return toPost(rows[0]);
}

/** Finds one post by its id. Returns null if there is no such post. */
export async function findPostById(id: number): Promise<Post | null> {
  const rows = await query<PostRow>(
    `SELECT id, author_id, title, content, created_at, updated_at
     FROM posts
     WHERE id = $1`,
    [id],
  );
  return rows[0] ? toPost(rows[0]) : null;
}

/**
 * The newest posts first, with the author's username.
 * Pagination: pass the smallest id you already have as `before` to get the next page
 * ("keyset pagination": fast, and nothing is skipped when new posts arrive).
 */
export async function listPosts({
  limit = 20,
  before,
}: { limit?: number; before?: number } = {}): Promise<PostWithAuthor[]> {
  const rows = await query<PostRow & { author_username: string }>(
    `SELECT p.id, p.author_id, p.title, p.content, p.created_at, p.updated_at,
            u.username AS author_username
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE $1::int IS NULL OR p.id < $1
     ORDER BY p.id DESC
     LIMIT $2`,
    [before ?? null, limit],
  );
  return rows.map((row) => ({
    ...toPost(row),
    authorUsername: row.author_username,
  }));
}

/** Changes a post's title and content. Returns null if the post doesn't exist. */
export async function updatePost(
  id: number,
  changes: { title: string; content: string },
): Promise<Post | null> {
  const rows = await query<PostRow>(
    `UPDATE posts
     SET title = $2, content = $3, updated_at = now()
     WHERE id = $1
     RETURNING id, author_id, title, content, created_at, updated_at`,
    [id, changes.title, changes.content],
  );
  return rows[0] ? toPost(rows[0]) : null;
}

/** Deletes a post. Returns true if a post was deleted. */
export async function deletePost(id: number): Promise<boolean> {
  const rows = await query<{ id: number }>(
    "DELETE FROM posts WHERE id = $1 RETURNING id",
    [id],
  );
  return rows.length > 0;
}
