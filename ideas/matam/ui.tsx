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
    <header className="z-20 flex shrink-0 items-center gap-3 border-b border-m-line-soft bg-m-surface px-4 py-3.5 shadow-m-sm">
      {start}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-[17px] font-bold leading-tight text-m-text">{title}</h1>
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
    <nav className="z-20 flex shrink-0 items-stretch border-t border-m-line-soft bg-m-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgba(74,48,30,0.18)]">
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            aria-current={on ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 pb-2.5 pt-3 text-[11px] font-medium transition-colors ${
              on ? "text-m-accent" : "text-m-faint hover:text-m-dim"
            }`}
          >
            {on && (
              <span
                aria-hidden
                className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-m-accent"
              />
            )}
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
  "rounded-2xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40";
export const mPrimary = `${mBtn} bg-m-accent text-white shadow-m hover:bg-m-accent-deep disabled:shadow-none`;
export const mGhost = `${mBtn} bg-m-raised text-m-text hover:bg-m-line`;
export const mDanger = `${mBtn} bg-m-danger/15 text-m-danger hover:bg-m-danger/25`;
export const mField =
  "w-full rounded-2xl border border-m-line bg-m-surface px-3.5 py-3 text-sm text-m-text shadow-m-sm outline-none transition-shadow placeholder:text-m-faint focus:border-m-accent/50 focus:shadow-m";

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
      <div className="relative flex max-h-[88%] w-full flex-col rounded-t-[1.75rem] bg-m-surface shadow-m-lg">
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-m-line-soft px-4 py-3.5">
            <h2 className="text-[15px] font-bold">{title}</h2>
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
