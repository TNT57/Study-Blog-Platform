// VIEW: write a new post (the Editor board, "new" mode). You must be logged in.
import type { Metadata } from "next";
import { Suspense } from "react";

import { PostForm } from "@/components/post-form";
import { PostFormSkeleton } from "@/components/skeletons";
import { createPost } from "@/controllers/post.actions";
import { requireUser } from "@/controllers/session";

export const metadata: Metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col gap-6 px-6 pt-10 pb-18"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">New post</h1>
        <p className="text-body text-muted-foreground">
          Share something you learned. Short is fine.
        </p>
      </div>
      {/* Checking the login cookie happens per request, so the form streams in. */}
      <Suspense fallback={<PostFormSkeleton />}>
        <NewPostForm />
      </Suspense>
    </main>
  );
}

async function NewPostForm() {
  // Not logged in? To the login page, and back here afterwards.
  await requireUser("/posts/new");
  return (
    <PostForm
      action={createPost}
      initialValues={{ title: "", content: "" }}
      submitLabel="Publish post"
      pendingLabel="Publishing…"
      cancelHref="/"
    />
  );
}
