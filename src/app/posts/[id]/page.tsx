// VIEW: one post (the Post detail board on the design canvas).
import { ArrowLeft, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DeletePostButton } from "@/components/delete-post-button";
import { PostDetailSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { deletePost } from "@/controllers/post.actions";
import { getPost } from "@/controllers/post.queries";
import { formatPostDate, initialOf, toParagraphs } from "@/lib/format";
import { parseId } from "@/lib/search-params";

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-1 flex-col gap-7 px-6 pt-10 pb-18"
    >
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-label font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4.5" aria-hidden="true" />
        All posts
      </Link>
      {/* The id is only known per request, so the post streams in with a skeleton first. */}
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostArticle params={params} />
      </Suspense>
    </main>
  );
}

async function PostArticle({
  params,
}: {
  params: PageProps<"/posts/[id]">["params"];
}) {
  const id = parseId((await params).id);
  const post = id === null ? null : await getPost(id);
  if (!post) notFound();

  return (
    <article className="flex flex-col gap-7">
      <header className="flex flex-col gap-4.5 border-b border-border pb-6">
        <h1 className="text-display [overflow-wrap:anywhere]">{post.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-small text-muted-foreground">
            <span
              className="inline-flex size-8 items-center justify-center rounded-full bg-focus-soft text-caption font-semibold text-primary"
              aria-hidden="true"
            >
              {initialOf(post.authorUsername)}
            </span>
            <span className="flex flex-col">
              <span className="text-label font-medium text-foreground">
                {post.authorUsername}
              </span>
              <span>
                <time dateTime={post.createdAt.toISOString()}>
                  {formatPostDate(post.createdAt)}
                </time>
                {post.edited && (
                  <>
                    {" · edited "}
                    <time dateTime={post.updatedAt.toISOString()}>
                      {formatPostDate(post.updatedAt)}
                    </time>
                  </>
                )}
              </span>
            </span>
          </div>
          {/* Until M4 everyone sees these. M4 shows them only to the author or an admin. */}
          <div className="flex gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <PenLine aria-hidden="true" />
              Edit
            </Link>
            <DeletePostButton
              postTitle={post.title}
              action={deletePost.bind(null, post.id)}
            />
          </div>
        </div>
      </header>

      {/* Plain text: React escapes it, so "<script>" in a post is shown, never run (more in M7). */}
      <div className="flex flex-col gap-5 text-reading [overflow-wrap:anywhere]">
        {toParagraphs(post.content).map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
