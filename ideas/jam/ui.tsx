"use client";

import { useEffect, useState } from "react";

/* ===================== إطار النظام ===================== */

/**
 * نظام إداري يُقرأ على شاشة مكتب، لا جوال.
 * فلا إطار جهاز هنا: عرض كامل مع قائمة جانبية خاصة بالنظام.
 */
export function Shell({
  nav,
  children,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-jam className="flex min-h-dvh bg-j-bg text-j-text">
      {nav}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-j-line bg-j-surface px-5 py-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="truncate text-lg font-bold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-j-dim">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto p-5">{children}</div>;
}

/* ===================== عناصر ===================== */

export const jBtn =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40";
export const jPrimary = `${jBtn} bg-j-brand text-white hover:bg-j-brand-deep`;
export const jGhost = `${jBtn} border border-j-line bg-j-surface text-j-text hover:bg-j-raised`;
export const jDanger = `${jBtn} text-j-danger hover:bg-j-danger/10`;
export const jField =
  "w-full rounded-xl border border-j-line bg-j-surface px-3 py-2.5 text-sm text-j-text outline-none transition-colors placeholder:text-j-faint focus:border-j-brand/60";

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
      <span
        className="mark text-2xl font-bold tabular-nums"
        style={{ color: tone ?? "var(--j-text)" }}
      >
        {value}
      </span>
      <span className="text-xs text-j-dim">{label}</span>
    </div>
  );
}

export function Tag({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        color: tone ?? "var(--j-dim)",
        backgroundColor: tone
          ? `color-mix(in oklab, ${tone} 14%, transparent)`
          : "var(--j-raised)",
      }}
    >
      {children}
    </span>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-j-line py-14 text-center">
      <p className="text-sm text-j-dim">{title}</p>
      {hint && <p className="text-xs text-j-faint">{hint}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-j-surface" />
      ))}
    </div>
  );
}

/* ===================== نافذة ===================== */

export function Modal({
  open,
  onClose,
  title,
  wide,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div data-jam className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        className={`relative flex max-h-[88dvh] w-full flex-col rounded-2xl bg-j-surface shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-j-line px-5 py-3.5">
          <h2 className="text-sm font-bold">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="p-1 text-j-faint hover:text-j-text">
            ✕
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-j-line p-4">{footer}</div>}
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-6">
      <div className="rounded-xl bg-j-text px-4 py-2.5 text-sm text-j-surface shadow-xl">
        {msg}
      </div>
    </div>
  ) : null;

  return { toast: setMsg, node };
}
