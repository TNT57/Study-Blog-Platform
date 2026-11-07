// VIEW: the home page, a list of posts (the Home board on the design canvas).
// The heading is part of the static shell (sent at once). The list streams in inside
// <Suspense>, because it depends on the URL (?before=) and on the database.
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { PostCard } from "@/components/post-card";
import { PostListSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { getPostPage, POSTS_PER_PAGE } from "@/controllers/post.queries";
import { parseId } from "@/lib/search-params";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-content flex-1 flex-wrap items-start gap-8 px-6 pt-12 pb-16"
    >
      <section
        aria-labelledby="posts-heading"
        className="flex min-w-0 flex-[999_1_560px] flex-col gap-6"
      >
        <div className="flex flex-col gap-1.5">
          <h1 id="posts-heading" className="text-h1">
            Posts
          </h1>
          <p className="text-body text-muted-foreground">
            What students are learning this week.
          </p>
        </div>
        <Suspense fallback={<PostListSkeleton />}>
          <PostList searchParams={searchParams} />
        </Suspense>
      </section>

      <aside
        aria-label="About"
        className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 px-1 pt-1"
      >
        <span className="text-small font-semibold">About Study Blog</span>
        <p className="text-small leading-[22px] text-muted-foreground">
          Write what you learn. Track how you focus. Read what others are
          studying.
        </p>
      </aside>
    </main>
  );
}

async function PostList({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const { before } = await searchParams;
  // A bad ?before= (like "abc") just shows the newest posts.
  const beforeId = parseId(before) ?? undefined;
  const { posts, nextBefore } = await getPostPage(beforeId);

  if (posts.length === 0) {
    return <EmptyState olderPage={beforeId !== undefined} />;
  }

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <nav
        aria-label="More posts"
        className="flex flex-wrap items-center justify-between gap-3 pt-2"
      >
        <span className="text-small text-muted-foreground">
          Newest first · {POSTS_PER_PAGE} posts per page
        </span>
        <div className="flex flex-wrap gap-2">
          {beforeId !== undefined && (
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden="true" />
              Newest posts
            </Link>
          )}
          {nextBefore !== null && (
            <Link
              href={`/?before=${nextBefore}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Older posts
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function EmptyState({ olderPage }: { olderPage: boolean }) {
  return (
    <section
      aria-labelledby="empty-title"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-focus-soft text-primary">
        <FileText className="size-6" aria-hidden="true" />
      </span>
      <h2 id="empty-title" className="text-h3">
        {olderPage ? "No older posts" : "No posts yet"}
      </h2>
      <p className="max-w-75 text-label leading-6 text-muted-foreground">
        {olderPage
          ? "You have reached the first post ever written here."
          : "Be the first to share what you learned today. Short notes are welcome."}
      </p>
      <Link
        href={olderPage ? "/" : "/posts/new"}
        className={buttonVariants({ className: "mt-1.5" })}
      >
        {olderPage ? "Back to the newest posts" : "Write the first post"}
      </Link>
    </section>
  );
}
