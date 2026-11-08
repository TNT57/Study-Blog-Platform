// The read side of the controller, on a real database.
import { describe, expect, it, vi } from "vitest";

// 'use cache', cacheLife() and cacheTag() only work inside Next.js. Here they do nothing,
// so we test the data, and check that the right cache tag is set.
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { cacheTag } from "next/cache";

import {
  getPost,
  getPostPage,
  POSTS_PER_PAGE,
} from "@/controllers/post.queries";
import { createPost } from "@/models/post.model";

import { makeUser } from "./helpers";

async function makePosts(count: number) {
  const author = await makeUser();
  for (let number = 1; number <= count; number += 1) {
    await createPost({
      authorId: author.id,
      title: `Post ${number}`,
      content: "Some content for this post.",
    });
  }
}

describe("getPostPage", () => {
  it("returns small DTOs with an excerpt, never whole rows", async () => {
    const author = await makeUser({ username: "trung" });
    await createPost({
      authorId: author.id,
      title: "Big-O",
      content: "word ".repeat(100),
    });

    const { posts, nextBefore } = await getPostPage();

    expect(posts).toHaveLength(1);
    expect(Object.keys(posts[0]).sort()).toEqual([
      "authorUsername",
      "createdAt",
      "excerpt",
      "id",
      "title",
    ]);
    expect(posts[0].authorUsername).toBe("trung");
    expect(posts[0].excerpt.endsWith("…")).toBe(true);
    expect(nextBefore).toBeNull();
    expect(cacheTag).toHaveBeenCalledWith("posts");
  });

  it(`pages through the posts, ${POSTS_PER_PAGE} at a time, newest first`, async () => {
    await makePosts(POSTS_PER_PAGE + 5);

    const first = await getPostPage();
    expect(first.posts).toHaveLength(POSTS_PER_PAGE);
    expect(first.posts[0].title).toBe(`Post ${POSTS_PER_PAGE + 5}`);
    expect(first.nextBefore).toBe(first.posts[POSTS_PER_PAGE - 1].id);

    const second = await getPostPage(first.nextBefore ?? undefined);
    expect(second.posts.map((post) => post.title)).toEqual([
      "Post 5",
      "Post 4",
      "Post 3",
      "Post 2",
      "Post 1",
    ]);
    expect(second.nextBefore).toBeNull();
  });

  it(`has no "older" page when there are exactly ${POSTS_PER_PAGE} posts`, async () => {
    await makePosts(POSTS_PER_PAGE);

    expect((await getPostPage()).nextBefore).toBeNull();
  });
});

describe("getPost", () => {
  it("returns the post with its author's name, and nothing secret", async () => {
    const author = await makeUser({ username: "linh" });
    const post = await createPost({
      authorId: author.id,
      title: "Hashing",
      content: "One-way.",
    });

    const detail = await getPost(post.id);

    expect(detail).toMatchObject({
      id: post.id,
      title: "Hashing",
      content: "One-way.",
      authorUsername: "linh",
      edited: false,
    });
    expect(JSON.stringify(detail)).not.toMatch(/password|email/i);
    expect(cacheTag).toHaveBeenCalledWith(`post:${post.id}`);
  });

  it("returns null when the post doesn't exist", async () => {
    expect(await getPost(999_999)).toBeNull();
  });
});
