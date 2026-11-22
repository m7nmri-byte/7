"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/SessionProvider";
import { ServiceLinks } from "@/components/ServiceLinks";
import { ideas } from "@/ideas";

function NavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-brand-soft font-medium text-brand"
          : "text-muted hover:bg-card hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { session, checking } = useSession();

  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto px-4 py-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="wordmark px-3 text-sm tracking-[0.4em] text-ink transition-colors hover:text-brand"
      >
        M7NMRI
      </Link>

      <nav className="flex flex-1 flex-col gap-5">
        <NavLink href="/" active={pathname === "/"} onNavigate={onNavigate}>
          <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0">
            <path
              d="M2.5 7 8 2.5 13.5 7v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          الرئيسية
        </NavLink>

        {ideas.length > 0 && (
          <div className="flex flex-col gap-1">
            {ideas.map((idea) => (
              <NavLink
                key={idea.slug}
                href={`/lab/${idea.slug}`}
                active={pathname === `/lab/${idea.slug}`}
                onNavigate={onNavigate}
              >
                <span className="truncate">{idea.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="flex flex-col gap-2 border-t border-edge pt-4">
        {checking ? (
          <span aria-hidden className="mx-1 h-9 animate-pulse rounded-xl bg-card" />
        ) : session ? (
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-medium text-brand"
            >
              {(session.user.email ?? "?").charAt(0).toUpperCase()}
            </span>
            <span
              className="mark min-w-0 flex-1 truncate text-xs text-muted"
              title={session.user.email}
            >
              {session.user.email}
            </span>
            <button
              onClick={() => {
                onNavigate();
                void supabase.auth.signOut();
              }}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-card hover:text-ink"
            >
              <svg viewBox="0 0 16 16" aria-hidden className="size-4">
                <path
                  d="M6.5 14h-3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.5 11 13.5 8l-3-3M13.5 8h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <NavLink href="/login" active={pathname === "/login"} onNavigate={onNavigate}>
            <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0">
              <path
                d="M6.5 14h-3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M10.5 11 13.5 8l-3-3M13.5 8h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            تسجيل الدخول
          </NavLink>
        )}

        <ServiceLinks />
      </div>
    </div>
  );
}
