"use server";
// CONTROLLER (changes) for posts: Server Actions.
//
// Every function exported from a "use server" file is a PUBLIC endpoint: anyone can call it
// with a POST request, without using our forms. So each action checks its input itself.
// (From M3 it also checks who is logged in, and from M4 who may change the post.)

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { DEMO_EMAIL } from "@/lib/demo";
import { parseId } from "@/lib/search-params";
import { parsePostForm, type PostFormState } from "@/lib/validation/post";
import * as posts from "@/models/post.model";
import { findUserByEmail } from "@/models/user.model";

// Temporary until M3 (login): every new post belongs to the seeded "demo" user.
async function getAuthorId(): Promise<number> {
  const demo = await findUserByEmail(DEMO_EMAIL);
  if (!demo) {
    throw new Error('There is no demo user yet. Run "pnpm db:seed" first.');
  }
  return demo.id;
}

// An id comes from the page, but the browser can send any value. Check it again here.
function checkId(id: unknown): number {
  const postId = parseId(String(id));
  if (postId === null) notFound();
  return postId;
}

/** Creates a post, then opens it. On invalid input it returns the errors to the form. */
export async function createPost(
  _previous: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const result = parsePostForm(formData);
  if (!result.success) return result.state;

  const authorId = await getAuthorId();
  const post = await posts.createPost({ authorId, ...result.data });

  updateTag("posts"); // the list must show the new post
  redirect(`/posts/${post.id}?toast=published`);
}

/** Saves changes to a post. Use it as updatePost.bind(null, post.id) in the edit page. */
export async function updatePost(
  id: number,
  _previous: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const postId = checkId(id);
  const result = parsePostForm(formData);
  if (!result.success) return result.state;

  const post = await posts.updatePost(postId, result.data);
  if (!post) notFound();

  updateTag("posts");
  updateTag(`post:${postId}`);
  redirect(`/posts/${postId}?toast=saved`);
}

/** Deletes a post, then goes back to the list. Use it as deletePost.bind(null, post.id). */
export async function deletePost(id: number): Promise<void> {
  const postId = checkId(id);
  await posts.deletePost(postId);

  updateTag("posts");
  updateTag(`post:${postId}`);
  redirect("/?toast=deleted");
}
