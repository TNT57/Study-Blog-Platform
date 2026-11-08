// One post in the list on the home page. A Server Component: no JavaScript is sent for it.
import Link from "next/link";

import type { PostListItem } from "@/controllers/post.queries";
import { formatPostDate, initialOf } from "@/lib/format";

export function PostCard({ post }: { post: PostListItem }) {
  return (
    <article className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5 rounded-xl border border-border bg-card px-5.5 py-5">
      <h2 className="text-h3 [overflow-wrap:anywhere]">
        <Link href={`/posts/${post.id}`} className="hover:text-primary-hover">
          {post.title}
        </Link>
      </h2>
      <p className="text-label leading-6 [overflow-wrap:anywhere] text-muted-foreground">
        {post.excerpt}
      </p>
      <div className="mt-auto flex items-center gap-2 pt-1 text-small text-muted-foreground">
        <span
          className="inline-flex size-6 items-center justify-center rounded-full bg-focus-soft text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {initialOf(post.authorUsername)}
        </span>
        <span>{post.authorUsername}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.createdAt.toISOString()}>
          {formatPostDate(post.createdAt)}
        </time>
      </div>
    </article>
  );
}
