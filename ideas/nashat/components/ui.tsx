"use client";

import { useEffect, useState } from "react";

/** الوقت الحالي، يتجدّد كل فترة — مصدر واحد لكل المؤقّتات الحيّة */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ===================== نافذة منبثقة ===================== */

export function Sheet({
  open,
  onClose,
  title,
  desc,
  children,
  closeLabel = "إلغاء",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc?: React.ReactNode;
  children: React.ReactNode;
  closeLabel?: string;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-edge bg-card p-5 shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <h3 className="mb-1 text-base font-semibold">{title}</h3>
        {desc && <p className="mb-4 text-xs leading-relaxed text-muted">{desc}</p>}
        <div className="flex flex-col gap-3">{children}</div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-2.5 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

/* ===================== عناصر إدخال ===================== */

export { btn, btnDanger, btnGhost, btnPrimary, field } from "@/components/styles";

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-faint">{children}</span>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

/** صفّ خيار داخل نافذة: أيقونة وعنوان وشرح */
export function OptionButton({
  icon,
  title,
  sub,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border border-edge bg-paper px-3.5 py-3 text-start transition-colors hover:border-brand/40 ${
        danger ? "text-[#e08a7a]" : "text-ink"
      }`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-sm">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{title}</span>
        {sub && <span className="truncate text-xs text-muted">{sub}</span>}
      </span>
    </button>
  );
}

/* ===================== تنبيه عابر ===================== */

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5">
      <div className="max-w-sm rounded-xl border border-edge bg-card px-4 py-2.5 text-center text-sm shadow-xl">
        {message}
      </div>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 3200);
    return () => clearTimeout(id);
  }, [message]);
  return { message, toast: setMessage };
}
