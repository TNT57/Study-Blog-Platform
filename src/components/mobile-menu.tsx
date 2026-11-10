"use client";
// The phone menu button (the HomePhone board). A native <details> element opens and closes
// without any JavaScript. This small Client Component only closes it again after you move to
// another page (the header stays on screen between pages, so it would stay open).
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    menu.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <details ref={menu} className="group relative sm:hidden">
      <summary
        aria-label="Menu"
        className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card [&::-webkit-details-marker]:hidden"
      >
        <Menu className="size-5 group-open:hidden" aria-hidden="true" />
        <X className="hidden size-5 group-open:block" aria-hidden="true" />
      </summary>
      <div className="absolute top-12 right-0 z-40 flex w-60 flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-[0_12px_32px_rgba(20,22,26,0.12)]">
        {children}
      </div>
    </details>
  );
}
