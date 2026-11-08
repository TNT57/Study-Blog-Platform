// VIEW: write a new post (the Editor board, "new" mode).
// Nothing here depends on the request, so the whole page is static.
import type { Metadata } from "next";

import { PostForm } from "@/components/post-form";
import { createPost } from "@/controllers/post.actions";

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
      <PostForm
        action={createPost}
        initialValues={{ title: "", content: "" }}
        submitLabel="Publish post"
        pendingLabel="Publishing…"
        cancelHref="/"
      />
    </main>
  );
}
