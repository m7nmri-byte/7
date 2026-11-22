"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STATUS, ideas } from "@/ideas";

const tab =
  "rounded-full px-3.5 py-1.5 text-sm transition-colors";
const tabOn = "bg-clay-soft font-medium text-clay";
const tabOff = "text-muted hover:text-ink";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // تُغلق بالنقر خارجها أو بمفتاح الهروب
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inLab = pathname.startsWith("/lab");

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mark text-lg font-semibold tracking-tight text-ink transition-colors hover:text-clay"
        >
          m7nmri
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-current={pathname === "/" ? "page" : undefined}
            className={`${tab} ${pathname === "/" ? tabOn : tabOff}`}
          >
            الرئيسية
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={`${tab} flex items-center gap-1.5 ${
                inLab || open ? tabOn : tabOff
              }`}
            >
              الأدوات
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path
                  d="M2.5 4.5 6 8l3.5-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute end-0 top-full mt-2 w-[17rem] overflow-hidden rounded-2xl border border-edge bg-card shadow-lg shadow-black/5"
              >
                {ideas.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted">لا توجد أدوات بعد.</p>
                ) : (
                  <ul className="max-h-[70vh] overflow-y-auto p-1.5">
                    {ideas.map((idea) => {
                      const active = pathname === `/lab/${idea.slug}`;
                      return (
                        <li key={idea.slug}>
                          <Link
                            href={`/lab/${idea.slug}`}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                              active ? "bg-clay-soft" : "hover:bg-paper"
                            }`}
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: STATUS[idea.status].color }}
                            />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="text-sm font-medium">{idea.title}</span>
                              <span className="truncate text-xs text-muted">
                                {idea.summary}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
