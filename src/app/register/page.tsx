// VIEW: the register page (the Register board on the design canvas).
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/components/register-form";
import { AuthFormSkeleton } from "@/components/skeletons";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <main
      id="main"
      className="flex flex-1 items-start justify-center px-6 pt-12 pb-18"
    >
      <div className="flex w-full max-w-105 flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-h1">Create an account</h1>
          <p className="text-body text-muted-foreground">
            Write what you learn. Track how you focus.
          </p>
        </div>
        <Suspense fallback={<AuthFormSkeleton fields={3} />}>
          <RegisterArea searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function RegisterArea({
  searchParams,
}: {
  searchParams: PageProps<"/register">["searchParams"];
}) {
  const next = safeNextPath((await searchParams).next);
  const loginHref =
    next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  return (
    <>
      <RegisterForm next={next} />
      <p className="text-center text-label text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
