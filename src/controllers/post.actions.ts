"use server";
// CONTROLLER (changes) for posts: Server Actions.
//
// Every function exported from a "use server" file is a PUBLIC endpoint: anyone can call it
// with a POST request, without using our forms. So each action checks its input itself,
// and who is logged in. (From M4 it also checks who may change THIS post.)

import { updateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { parseId } from "@/lib/search-params";
import { parsePostForm, type PostFormState } from "@/lib/validation/post";
import * as posts from "@/models/post.model";

import { requireUser } from "./session";

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
  // Who is asking comes from the session cookie, never from the form.
  const user = await requireUser("/posts/new");
  const result = parsePostForm(formData);
  if (!result.success) return result.state;

  const post = await posts.createPost({ authorId: user.id, ...result.data });

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
  await requireUser(`/posts/${postId}/edit`); // M4: and only the author or an admin
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
  await requireUser(`/posts/${postId}`); // M4: and only the author or an admin
  await posts.deletePost(postId);

  updateTag("posts");
  updateTag(`post:${postId}`);
  redirect("/?toast=deleted");
}
