"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STATUS, type Status, ideas } from "@/ideas";

/** ترتيب أقسام القائمة حسب دورة حياة الفكرة */
const GROUPS: Status[] = ["building", "ripe", "seed", "freed"];

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

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5">
      <Link
        href="/"
        onClick={onNavigate}
        className="mark px-3 text-lg font-semibold tracking-tight text-ink transition-colors hover:text-brand"
      >
        m7nmri
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-0.5">
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
        </div>

        {ideas.length === 0 ? (
          <p className="px-3 text-xs text-faint">لا توجد أدوات بعد.</p>
        ) : (
          GROUPS.map((status) => {
            const group = ideas.filter((i) => i.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className="flex flex-col gap-1">
                <h2 className="flex items-center gap-2 px-3 pb-1 text-xs font-medium text-faint">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: STATUS[status].color }}
                  />
                  {STATUS[status].label}
                </h2>
                {group.map((idea) => (
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
            );
          })
        )}
      </nav>

      <a
        href="https://github.com/m7nmri-byte/7"
        target="_blank"
        rel="noreferrer"
        className="mark flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-faint transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 shrink-0" fill="currentColor">
          <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
        </svg>
        المستودع
      </a>
    </div>
  );
}
