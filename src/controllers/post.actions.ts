"use server";
// CONTROLLER (changes) for posts: Server Actions.
//
// Every function exported from a "use server" file is a PUBLIC endpoint: anyone can call it
// with a POST request, without using our forms. So each action checks everything itself:
// the input, who is logged in (authentication), and whether they may change THIS post
// (authorization). Hiding the Edit button is not enough.

import { updateTag } from "next/cache";
import { forbidden, notFound, redirect } from "next/navigation";

import { canEditPost } from "@/lib/policies";
import { parseId } from "@/lib/search-params";
import { parsePostForm, type PostFormState } from "@/lib/validation/post";
import * as posts from "@/models/post.model";

import { type CurrentUser, requireUser } from "./session";

// An id comes from the page, but the browser can send any value. Check it again here.
function checkId(id: unknown): number {
  const postId = parseId(String(id));
  if (postId === null) notFound();
  return postId;
}

/** May this user change this post? No such post → 404. Not the author or an admin → 403. */
async function checkCanEdit(postId: number, user: CurrentUser): Promise<void> {
  const post = await posts.findPostById(postId);
  if (!post) notFound();
  if (!canEditPost(user, post)) forbidden();
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
  const user = await requireUser(`/posts/${postId}/edit`);
  // Check the permission BEFORE reading the form: someone who may not edit learns nothing.
  await checkCanEdit(postId, user);
  const result = parsePostForm(formData);
  if (!result.success) return result.state;

  const post = await posts.updatePost(postId, result.data);
  if (!post) notFound(); // deleted by someone else in the meantime

  updateTag("posts");
  updateTag(`post:${postId}`);
  redirect(`/posts/${postId}?toast=saved`);
}

/** Deletes a post, then goes back to the list. Use it as deletePost.bind(null, post.id). */
export async function deletePost(id: number): Promise<void> {
  const postId = checkId(id);
  const user = await requireUser(`/posts/${postId}`);
  await checkCanEdit(postId, user);
  await posts.deletePost(postId);

  updateTag("posts");
  updateTag(`post:${postId}`);
  redirect("/?toast=deleted");
}
