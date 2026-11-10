// CONTROLLER (reads) for posts. Pages call these to get data.
// "server-only" makes the build fail if a Client Component ever imports this file,
// so this code (and the database) can never end up in the browser.
import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { makeExcerpt, wasEdited } from "@/lib/format";
import { findPostById, listPosts } from "@/models/post.model";
import { findUserById } from "@/models/user.model";

export const POSTS_PER_PAGE = 20;

// DTOs ("data transfer objects"): small plain objects with only what the page needs.
// A page never gets a whole database row, so something like password_hash can't leak.

export type PostListItem = {
  id: number;
  title: string;
  excerpt: string;
  authorUsername: string;
  createdAt: Date;
};

export type PostPage = {
  posts: PostListItem[];
  /** Pass this as `before` to get the next (older) page. null = this is the last page. */
  nextBefore: number | null;
};

export type PostDetail = {
  id: number;
  /** Needed by canEditPost() to know whose post this is. */
  authorId: number;
  title: string;
  content: string;
  authorUsername: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
};

/**
 * One page of posts, newest first. Cached: the list is the same for every visitor.
 * The cache is cleared with updateTag("posts") after a post is created, changed or deleted.
 */
export async function getPostPage(before?: number): Promise<PostPage> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  // Ask for one extra post: if it comes back, there is an older page.
  const rows = await listPosts({ limit: POSTS_PER_PAGE + 1, before });
  const page = rows.slice(0, POSTS_PER_PAGE);
  const hasMore = rows.length > POSTS_PER_PAGE;

  return {
    posts: page.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: makeExcerpt(post.content),
      authorUsername: post.authorUsername,
      createdAt: post.createdAt,
    })),
    nextBefore: hasMore ? page[page.length - 1].id : null,
  };
}

/** One post, or null if it doesn't exist. Cached per post, cleared with updateTag(`post:${id}`). */
export async function getPost(id: number): Promise<PostDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag(`post:${id}`);

  const post = await findPostById(id);
  if (!post) return null;
  const author = await findUserById(post.authorId);

  return {
    id: post.id,
    authorId: post.authorId,
    title: post.title,
    content: post.content,
    authorUsername: author?.username ?? "unknown",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    edited: wasEdited(post.createdAt, post.updatedAt),
  };
}
