// Loading placeholders (the Loading board on the design canvas).
// Each one is the `fallback` of a <Suspense> boundary and has about the same size as the real
// content, so the page doesn't jump when the data arrives.
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-skeleton motion-reduce:animate-none",
        className,
      )}
    />
  );
}

function Loading({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" className={className}>
      {/* Screen readers hear this; everyone else sees the grey shapes. */}
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}

export function PostListSkeleton() {
  return (
    <Loading label="Loading posts…" className="flex flex-wrap gap-4">
      {[1, 2, 3, 4].map((card) => (
        <div
          key={card}
          className="flex min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-xl border border-border bg-card px-5.5 py-5"
        >
          <Bone className="h-5 w-4/5" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-11/12" />
          <div className="flex items-center gap-2 pt-2">
            <Bone className="size-6 rounded-full" />
            <Bone className="h-4 w-32" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function PostDetailSkeleton() {
  return (
    <Loading label="Loading the post…" className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <Bone className="h-10 w-11/12" />
        <Bone className="h-10 w-2/3" />
        <div className="flex items-center gap-2.5 pt-1">
          <Bone className="size-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Bone className="h-4 w-20" />
            <Bone className="h-3.5 w-28" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map(
          (width, line) => (
            <Bone key={line} className={cn("h-4", width)} />
          ),
        )}
      </div>
    </Loading>
  );
}

export function PostFormSkeleton() {
  return (
    <Loading
      label="Loading the post…"
      className="flex flex-col gap-5.5 rounded-xl border border-border bg-card p-7"
    >
      <Bone className="h-4 w-12" />
      <Bone className="h-11 w-full" />
      <Bone className="h-4 w-16" />
      <Bone className="h-80 w-full" />
    </Loading>
  );
}
