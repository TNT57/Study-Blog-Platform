// VIEW: the login page (the Login board on the design canvas).
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { AuthFormSkeleton } from "@/components/skeletons";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main
      id="main"
      className="flex flex-1 items-start justify-center px-6 pt-12 pb-18"
    >
      <div className="flex w-full max-w-105 flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-h1">Welcome back</h1>
          <p className="text-body text-muted-foreground">
            Log in to write posts and track your focus.
          </p>
        </div>
        {/* ?next= is only known per request, so the form streams in. */}
        <Suspense fallback={<AuthFormSkeleton fields={2} />}>
          <LoginArea searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginArea({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const next = safeNextPath((await searchParams).next);
  const registerHref =
    next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`;
  return (
    <>
      <LoginForm next={next} />
      <p className="text-center text-label text-muted-foreground">
        No account yet?{" "}
        <Link
          href={registerHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
