// VIEW: edit a post (the Editor board, "edit" mode).
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { Suspense } from "react";

import { PostForm } from "@/components/post-form";
import { PostFormSkeleton } from "@/components/skeletons";
import { updatePost } from "@/controllers/post.actions";
import { getPost } from "@/controllers/post.queries";
import { requireUser } from "@/controllers/session";
import { canEditPost } from "@/lib/policies";
import { parseId } from "@/lib/search-params";

export const metadata: Metadata = { title: "Edit post" };

export default function EditPostPage({
  params,
}: PageProps<"/posts/[id]/edit">) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col gap-6 px-6 pt-10 pb-18"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h1">Edit post</h1>
        <p className="text-body text-muted-foreground">
          Changes are visible to everyone after you save.
        </p>
      </div>
      <Suspense fallback={<PostFormSkeleton />}>
        <EditForm params={params} />
      </Suspense>
    </main>
  );
}

async function EditForm({
  params,
}: {
  params: PageProps<"/posts/[id]/edit">["params"];
}) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  const user = await requireUser(`/posts/${id}/edit`);
  const post = await getPost(id);
  if (!post) notFound();
  // Someone else's post: the 403 page (src/app/forbidden.tsx). The action checks again on save.
  if (!canEditPost(user, post)) forbidden();

  return (
    <PostForm
      // A new key when the post changes: React then starts a fresh form with the new text.
      key={post.updatedAt.toISOString()}
      // bind() fixes the first argument, so the action knows which post to save.
      action={updatePost.bind(null, post.id)}
      initialValues={{ title: post.title, content: post.content }}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      cancelHref={`/posts/${post.id}`}
    />
  );
}
