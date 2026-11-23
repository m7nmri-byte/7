"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * وضع الإطار: صفحة كاملة، أو جهاز ضمن منصّة تعرض عدة أجهزة.
 * الأداة لا تعرف أيّهما — الإطار وحده يتصرّف حسب السياق.
 */
const PhoneMode = createContext<"page" | "embedded">("page");
export const PhoneBench = PhoneMode.Provider;

/* ===================== إطار الجوال ===================== */

/**
 * كل واجهة تعيش داخل عرض جوال.
 * على الجوال تملأ الشاشة، وعلى سطح المكتب تظهر كجهاز قائم بذاته —
 * فيمكن فتح واجهتين جنبًا إلى جنب ومتابعة الطلب وهو ينتقل بينهما.
 */
export function Phone({
  children,
  bar,
}: {
  children: React.ReactNode;
  bar?: React.ReactNode;
}) {
  const mode = useContext(PhoneMode);
  const frame =
    mode === "embedded"
      ? "relative h-full w-full rounded-[1.75rem] border border-m-line shadow-xl shadow-black/30"
      : "relative mx-auto h-dvh w-full max-w-[26rem] sm:my-[2.5dvh] sm:h-[min(44rem,95dvh)] sm:rounded-[2rem] sm:border sm:border-m-line sm:shadow-2xl sm:shadow-black/40";

  return (
    <div data-matam className={`flex flex-col overflow-hidden bg-m-bg ${frame}`}>
      {children}
      {bar}
    </div>
  );
}

/** شريط علوي ثابت */
export function TopBar({
  title,
  subtitle,
  start,
  end,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  start?: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-m-line bg-m-surface px-4 py-3">
      {start}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold text-m-text">{title}</h1>
        {subtitle && <p className="truncate text-xs text-m-dim">{subtitle}</p>}
      </div>
      {end}
    </header>
  );
}

/** المنطقة القابلة للتمرير بين الشريطين */
export function Body({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto overscroll-contain ${className}`}>
      {children}
    </div>
  );
}

/** شريط تبويب سفلي */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; icon: React.ReactNode; badge?: number }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <nav className="flex shrink-0 items-stretch border-t border-m-line bg-m-surface pb-[env(safe-area-inset-bottom)]">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            aria-current={on ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
              on ? "text-m-accent" : "text-m-faint hover:text-m-dim"
            }`}
          >
            <span className="relative">
              {t.icon}
              {t.badge ? (
                <span className="absolute -end-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-m-accent px-1 text-[10px] font-bold text-black">
                  {t.badge > 99 ? "99" : t.badge}
                </span>
              ) : null}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ===================== عناصر ===================== */

export const mBtn =
  "rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40";
export const mPrimary = `${mBtn} bg-m-accent text-[#ffffff] hover:brightness-110`;
export const mGhost = `${mBtn} border border-m-line text-m-text hover:bg-m-raised`;
export const mDanger = `${mBtn} bg-m-danger/15 text-m-danger hover:bg-m-danger/25`;
export const mField =
  "w-full rounded-xl border border-m-line bg-m-raised px-3 py-3 text-sm text-m-text outline-none transition-colors placeholder:text-m-faint focus:border-m-accent/60";

export function Chip({
  color,
  children,
}: {
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        color: color ?? "var(--m-dim)",
        backgroundColor: color
          ? `color-mix(in oklab, ${color} 16%, transparent)`
          : "var(--m-raised)",
      }}
    >
      {children}
    </span>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="my-auto flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-sm text-m-dim">{title}</p>
      {hint && <p className="text-xs text-m-faint">{hint}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-m-surface" />
      ))}
    </div>
  );
}

/* ===================== ورقة منبثقة ===================== */

export function MSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div data-matam className="absolute inset-0 z-50 flex items-end overflow-hidden rounded-[inherit]">
      <button aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative flex max-h-[85%] w-full flex-col rounded-t-3xl border-t border-m-line bg-m-surface">
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-m-line px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="إغلاق" className="p-1 text-m-faint hover:text-m-text">
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-m-line p-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ===================== تنبيه عابر ===================== */

export function useMToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(id);
  }, [msg]);

  const node = msg ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-[60] flex justify-center px-6">
      <div className="rounded-xl bg-m-raised px-4 py-2.5 text-center text-sm text-m-text shadow-xl">
        {msg}
      </div>
    </div>
  ) : null;

  return { toast: setMsg, node };
}
