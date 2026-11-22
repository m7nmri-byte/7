"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarContent } from "@/components/Sidebar";
import { getIdea } from "@/ideas";

function useTitle(): string {
  const pathname = usePathname();
  if (pathname === "/") return "الرئيسية";
  const slug = pathname.startsWith("/lab/") ? pathname.slice(5) : "";
  return getIdea(slug)?.title ?? "";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const title = useTitle();

  // يُمنع تمرير الصفحة خلف الدرج وهو مفتوح
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="flex min-h-dvh">
      {/* القائمة الجانبية — ثابتة على الشاشات الكبيرة */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-edge bg-paper lg:block">
        <SidebarContent onNavigate={close} />
      </aside>

      {/* الدرج — على الجوال */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="إغلاق القائمة"
          onClick={close}
          className={`absolute inset-0 bg-ink/35 backdrop-blur-[2px] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-y-0 start-0 w-72 max-w-[85vw] border-e border-edge bg-paper shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <SidebarContent onNavigate={close} />
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-edge bg-paper/85 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
            className="rounded-xl p-2 text-muted transition-colors hover:bg-card hover:text-ink"
          >
            <svg viewBox="0 0 20 20" aria-hidden className="size-5">
              <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="truncate text-sm font-medium">{title}</span>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

      </div>
    </div>
  );
}
