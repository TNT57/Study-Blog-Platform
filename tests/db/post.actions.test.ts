// The Server Actions (the write side of the controller), on a real database.
import { beforeEach, describe, expect, it, vi } from "vitest";

// Outside Next.js these functions don't work, so we replace them with "mocks" that record calls.
// The real redirect() and notFound() stop the action by throwing. Ours do the same.
vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
// cookies() becomes a pretend cookie jar, so tests can be "logged in".
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./cookie-jar");
  return { cookies: () => cookieJar.cookies() };
});
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

import { updateTag } from "next/cache";

import { createPost, deletePost, updatePost } from "@/controllers/post.actions";
import { startSession } from "@/controllers/session";
import { query } from "@/lib/db";
import type { PostFormState } from "@/lib/validation/post";
import * as posts from "@/models/post.model";

import { cookieJar } from "./cookie-jar";
import { makeUser } from "./helpers";

const empty: PostFormState = { values: { title: "", content: "" } };

function form(fields: { title: string; content: string }) {
  const formData = new FormData();
  formData.append("title", fields.title);
  formData.append("content", fields.content);
  return formData;
}

async function countPosts() {
  const [row] = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM posts",
  );
  return row.count;
}

/** Makes a user and logs them in (puts a real session token in the cookie jar). */
async function logIn(overrides: Parameters<typeof makeUser>[0] = {}) {
  const user = await makeUser(overrides);
  await startSession(user.id);
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
});

describe("createPost", () => {
  it("saves the post for the logged-in user, clears the list cache and opens the post", async () => {
    const author = await logIn();

    await expect(
      createPost(
        empty,
        form({ title: "Big-O", content: "Count the steps first." }),
      ),
    ).rejects.toThrow("REDIRECT /posts/1?toast=published");

    expect(await posts.findPostById(1)).toMatchObject({
      authorId: author.id,
      title: "Big-O",
    });
    expect(updateTag).toHaveBeenCalledWith("posts");
  });

  it("sends a visitor who isn't logged in to the login page, and saves nothing", async () => {
    await expect(
      createPost(
        empty,
        form({ title: "Big-O", content: "Count the steps first." }),
      ),
    ).rejects.toThrow("REDIRECT /login?next=%2Fposts%2Fnew");

    expect(await countPosts()).toBe(0);
  });

  it("returns the errors and the typed values, and saves nothing", async () => {
    await logIn();
    const typed = { title: "  ", content: "short" };

    const state = await createPost(empty, form(typed));

    expect(state.values).toEqual(typed);
    expect(state.errors?.title).toEqual(["Title is required."]);
    expect(await countPosts()).toBe(0);
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("updatePost", () => {
  async function makePost() {
    const author = await makeUser();
    return posts.createPost({
      authorId: author.id,
      title: "Old title",
      content: "Old content, long enough.",
    });
  }

  it("saves the changes, clears both caches and opens the post", async () => {
    const post = await makePost();
    await logIn();

    await expect(
      updatePost(
        post.id,
        empty,
        form({ title: "New title", content: "New content here." }),
      ),
    ).rejects.toThrow(`REDIRECT /posts/${post.id}?toast=saved`);

    expect((await posts.findPostById(post.id))?.title).toBe("New title");
    expect(updateTag).toHaveBeenCalledWith("posts");
    expect(updateTag).toHaveBeenCalledWith(`post:${post.id}`);
  });

  it("returns errors and leaves the post unchanged", async () => {
    const post = await makePost();
    await logIn();

    const state = await updatePost(
      post.id,
      empty,
      form({ title: "", content: "short" }),
    );

    expect(state.errors?.content).toEqual([
      "Content must be at least 10 characters.",
    ]);
    expect((await posts.findPostById(post.id))?.title).toBe("Old title");
  });

  it("answers 'not found' for a post that doesn't exist", async () => {
    await logIn();
    await expect(
      updatePost(
        999,
        empty,
        form({ title: "New title", content: "New content here." }),
      ),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("refuses a visitor who isn't logged in, and changes nothing", async () => {
    const post = await makePost();

    await expect(
      updatePost(
        post.id,
        empty,
        form({ title: "Hacked", content: "Changed without logging in." }),
      ),
    ).rejects.toThrow(`REDIRECT /login?next=%2Fposts%2F${post.id}%2Fedit`);

    expect((await posts.findPostById(post.id))?.title).toBe("Old title");
  });
});

describe("deletePost", () => {
  it("deletes the post, clears both caches and goes back to the list", async () => {
    const author = await makeUser();
    const post = await posts.createPost({
      authorId: author.id,
      title: "Bye",
      content: "This post will be deleted.",
    });
    await logIn();

    await expect(deletePost(post.id)).rejects.toThrow(
      "REDIRECT /?toast=deleted",
    );

    expect(await countPosts()).toBe(0);
    expect(updateTag).toHaveBeenCalledWith("posts");
    expect(updateTag).toHaveBeenCalledWith(`post:${post.id}`);
  });

  it("refuses an id that isn't a real number, and deletes nothing", async () => {
    const author = await makeUser();
    await posts.createPost({
      authorId: author.id,
      title: "Stay",
      content: "This post must stay.",
    });

    // A Server Action is a public endpoint: someone can send any value, not just numbers.
    const attack = "1 OR 1=1" as unknown as number;
    await expect(deletePost(attack)).rejects.toThrow("NOT_FOUND");

    expect(await countPosts()).toBe(1);
  });

  it("refuses a visitor who isn't logged in, and deletes nothing", async () => {
    const author = await makeUser();
    const post = await posts.createPost({
      authorId: author.id,
      title: "Stay",
      content: "This post must stay.",
    });

    await expect(deletePost(post.id)).rejects.toThrow("REDIRECT /login");

    expect(await countPosts()).toBe(1);
  });
});
