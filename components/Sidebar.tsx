"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/SessionProvider";
import { ServiceLinks } from "@/components/ServiceLinks";
import { getIdea, groupIdeas, groups, soloIdeas } from "@/ideas";

const rowBase =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors";

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
      className={`${rowBase} ${
        active
          ? "bg-brand-soft font-medium text-brand"
          : "text-muted hover:bg-card hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/** أيقونة المجموعة من تعريفها في السجل */
function GroupMark({ slug }: { slug: string }) {
  const g = groups.find((x) => x.slug === slug);
  if (!g) return null;
  return (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-md"
      style={{ backgroundColor: g.icon.bg }}
    >
      <svg viewBox="0 0 24 24" className="size-3.5">
        <path
          d={g.icon.path}
          fill="none"
          stroke={g.icon.fg}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { session, checking } = useSession();

  // المجموعة التي تخصّ الصفحة الحالية تُفتح وحدها
  const slug = pathname.startsWith("/lab/") ? pathname.slice(5) : "";
  const currentGroup = getIdea(slug)?.group ?? null;
  const [open, setOpen] = useState<string | null>(currentGroup);
  const shown = open ?? currentGroup;

  const group = shown ? groups.find((g) => g.slug === shown) : null;

  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto px-4 py-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="wordmark px-3 text-sm tracking-[0.4em] text-ink transition-colors hover:text-brand"
      >
        M7NMRI
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {group ? (
          <>
            <button
              onClick={() => setOpen(null)}
              className={`${rowBase} text-muted hover:bg-card hover:text-ink`}
            >
              <span aria-hidden className="text-base leading-none">
                ›
              </span>
              رجوع
            </button>

            <div className="flex items-center gap-2.5 px-3 pb-1 pt-3">
              <GroupMark slug={group.slug} />
              <span className="text-sm font-semibold text-ink">{group.title}</span>
            </div>

            {groupIdeas(group.slug).map((i) => (
              <NavLink
                key={i.slug}
                href={`/lab/${i.slug}`}
                active={pathname === `/lab/${i.slug}`}
                onNavigate={onNavigate}
              >
                <span className="truncate">{i.title}</span>
              </NavLink>
            ))}
          </>
        ) : (
          <>
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

            {soloIdeas().map((i) => (
              <NavLink
                key={i.slug}
                href={`/lab/${i.slug}`}
                active={pathname === `/lab/${i.slug}`}
                onNavigate={onNavigate}
              >
                <span className="truncate">{i.title}</span>
              </NavLink>
            ))}

            {groups.map((g) => (
              <button
                key={g.slug}
                onClick={() => setOpen(g.slug)}
                className={`${rowBase} justify-between text-muted hover:bg-card hover:text-ink`}
              >
                <span className="flex items-center gap-2.5">
                  <GroupMark slug={g.slug} />
                  <span className="truncate">{g.title}</span>
                </span>
                <span aria-hidden className="text-faint">
                  ‹
                </span>
              </button>
            ))}
          </>
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
