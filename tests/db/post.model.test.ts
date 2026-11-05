import { describe, expect, it } from "vitest";

import { query } from "@/lib/db";
import {
  createPost,
  deletePost,
  findPostById,
  listPosts,
  updatePost,
} from "@/models/post.model";

import { makeUser } from "./helpers";

async function makePost(authorId: number, title = "A post") {
  return createPost({ authorId, title, content: "Some content." });
}

describe("post model", () => {
  it("creates a post", async () => {
    const author = await makeUser();

    const post = await createPost({
      authorId: author.id,
      title: "SQL joins explained",
      content: "An INNER JOIN is...",
    });

    expect(post).toMatchObject({
      authorId: author.id,
      title: "SQL joins explained",
    });
    expect(post.createdAt).toBeInstanceOf(Date);
  });

  it("lists the newest posts first, with the author's username", async () => {
    const author = await makeUser({ username: "linh" });
    await makePost(author.id, "Old");
    await makePost(author.id, "New");

    const posts = await listPosts();

    expect(posts.map((p) => p.title)).toEqual(["New", "Old"]);
    expect(posts[0].authorUsername).toBe("linh");
  });

  it("pages through posts with `before` (keyset pagination)", async () => {
    const author = await makeUser();
    for (const title of ["1", "2", "3", "4", "5"])
      await makePost(author.id, title);

    const page1 = await listPosts({ limit: 2 });
    const page2 = await listPosts({ limit: 2, before: page1.at(-1)!.id });
    const page3 = await listPosts({ limit: 2, before: page2.at(-1)!.id });

    expect(page1.map((p) => p.title)).toEqual(["5", "4"]);
    expect(page2.map((p) => p.title)).toEqual(["3", "2"]);
    expect(page3.map((p) => p.title)).toEqual(["1"]);
  });

  it("updates a post and moves updatedAt forward", async () => {
    const author = await makeUser();
    const post = await makePost(author.id);

    const updated = await updatePost(post.id, {
      title: "New title",
      content: "New text.",
    });

    expect(updated?.title).toBe("New title");
    // Ask Postgres, which measures time in microseconds (JS Dates only have milliseconds).
    const [row] = await query<{ moved: boolean }>(
      "SELECT updated_at > created_at AS moved FROM posts WHERE id = $1",
      [post.id],
    );
    expect(row.moved).toBe(true);
    expect(await updatePost(999_999, { title: "x", content: "y" })).toBeNull();
  });

  it("deletes a post", async () => {
    const author = await makeUser();
    const post = await makePost(author.id);

    expect(await deletePost(post.id)).toBe(true);
    expect(await deletePost(post.id)).toBe(false);
  });

  // TODO(you): Task 2 — these 3 tests are red until you write findPostById().
  describe("findPostById (Task 2)", () => {
    it("finds a post by its id", async () => {
      const author = await makeUser();
      const post = await makePost(author.id, "Find me");

      const found = await findPostById(post.id);

      expect(found).toEqual(post);
    });

    it("returns null when there is no post with that id", async () => {
      expect(await findPostById(999_999)).toBeNull();
    });

    it("treats an SQL injection attempt as data, not as SQL", async () => {
      const author = await makeUser();
      await makePost(author.id, "Secret draft");

      // If the id were glued into the SQL text, this would become
      // "WHERE id = 0 OR 1=1" and return a post. With $1 it's just a bad number.
      const attack = "0 OR 1=1" as unknown as number;
      const result = await findPostById(attack).catch(() => null);

      expect(result).toBeNull();
    });
  });
});
