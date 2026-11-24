"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "./theme";
import { clearWrite, useFailures } from "@/lib/failures";

/**
 * وضع الإطار: صفحة كاملة، أو جهاز ضمن منصّة تعرض عدة أجهزة.
 * الأداة لا تعرف أيّهما — الإطار وحده يتصرّف حسب السياق.
 */
const PhoneMode = createContext<"page" | "embedded">("page");
export const PhoneBench = PhoneMode.Provider;

/* ===================== إطار الجوال ===================== */

/**
 * كل واجهة تعيش داخل عرض جوال.
 *
 * على الجوال تملأ الشاشة بلا إطار — فالجهاز بيدك هو الإطار، ورسمُ
 * إطارٍ داخل إطار عبث. وعلى الشاشة العريضة يظهر هيكل جهاز: حافّة
 * داكنة وكاميرا وأزرار جانبية، فيُقرأ أنّه جوالٌ قائم بذاته — ويمكن
 * فتح واجهتين جنبًا إلى جنب ومتابعة الطلب وهو ينتقل بينهما.
 */
export function Phone({
  children,
  bar,
}: {
  children: React.ReactNode;
  bar?: React.ReactNode;
}) {
  const mode = useContext(PhoneMode);
  /** المظهر يُقرأ هنا مرّة، فيَرِثه كل ما في الجهاز */
  const { style, card } = useTheme();
  const embedded = mode === "embedded";

  /** الشاشة: هي ما يُقصّ عليه المحتوى، وفيها تُفتح الأوراق المنبثقة */
  const screen = (
    <div
      data-matam
      data-card={card}
      style={style}
      className={
        "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-m-bg " +
        (embedded ? "rounded-[1.6rem]" : "sm:rounded-[1.6rem]")
      }
    >
      {children}
      {bar}
    </div>
  );

  /** على الجوال: بلا هيكل، الشاشة وحدها تملأ المساحة */
  if (!embedded) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-[26rem] flex-col sm:my-[2.5dvh] sm:h-[min(44rem,95dvh)]">
        <Device>{screen}</Device>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Device embedded>{screen}</Device>
    </div>
  );
}

/**
 * هيكل الجهاز: حافّة داكنة وكاميرا وأزرار.
 *
 * ألوانه ثابتة لا من متغيّرات المطعم: هذا عتادٌ لا واجهة، فلا يتبدّل
 * بلوحة المدير. والأزرار خارج الحافّة فلا يُقصّ الهيكل.
 */
function Device({
  children,
  embedded,
}: {
  children: React.ReactNode;
  embedded?: boolean;
}) {
  /** على الجوال الحقيقي لا هيكل — يبدأ من sm */
  const body = embedded
    ? "flex h-full w-full flex-col rounded-[1.95rem] bg-[#15161a] p-[0.35rem] pt-[1.1rem] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-[#33353c]"
    : "flex h-full w-full flex-col sm:rounded-[1.95rem] sm:bg-[#15161a] sm:p-[0.35rem] sm:pt-[1.1rem] sm:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] sm:ring-1 sm:ring-[#33353c]";

  const chrome = embedded ? "" : "hidden sm:block";

  return (
    <>
      <div className={body}>
        {/* الكاميرا في الحافّة لا فوق الشاشة، فلا تحجب شيئًا من الواجهة */}
        <span
          aria-hidden
          className={
            "pointer-events-none absolute inset-x-0 top-[0.42rem] mx-auto size-[0.34rem] rounded-full bg-[#2c2f36] ring-1 ring-[#3f434c] " +
            chrome
          }
        />
        {children}
      </div>

      {/* أزرار جانبية — زينةٌ تُكمل الهيئة، ولا تلتقط ضغطًا */}
      <span
        aria-hidden
        className={
          "pointer-events-none absolute -left-0.5 top-[7.5rem] h-10 w-0.5 rounded-full bg-[#2c2f36] " +
          chrome
        }
      />
      <span
        aria-hidden
        className={
          "pointer-events-none absolute -left-0.5 top-[10.6rem] h-10 w-0.5 rounded-full bg-[#2c2f36] " +
          chrome
        }
      />
      <span
        aria-hidden
        className={
          "pointer-events-none absolute -right-0.5 top-[8.8rem] h-14 w-0.5 rounded-full bg-[#2c2f36] " +
          chrome
        }
      />
    </>
  );
}

/** شريط علوي ثابت */
/**
 * شريط واحد يعترف بما تعذّر جلبه.
 * قبله كان الجدول الممنوع يظهر كجدول فارغ، فتبدو الشاشة سليمة وهي معطوبة.
 */
export function DataErrorBar() {
  const { reads, write } = useFailures("matam");
  if (reads.length === 0 && !write) return null;
  return (
    <div className="shrink-0 border-b border-m-danger/30 bg-m-danger/10 px-4 py-2">
      {write && (
        <button
          onClick={() => clearWrite("matam")}
          className="flex w-full items-start gap-2 text-start"
        >
          <span className="flex-1 text-[11px] font-semibold text-m-danger">
            تعذّر الحفظ — {write}
          </span>
          <span className="shrink-0 text-[11px] text-m-danger/70">×</span>
        </button>
      )}

      {reads.length > 0 && (
        <>
          <p className="text-[11px] font-semibold text-m-danger">
            تعذّر جلب {reads.length === 1 ? "جدول" : reads.length + " جداول"}
          </p>
          {reads.map((r) => (
            <p key={r.key} className="truncate text-[10px] text-m-danger/80">
              <span className="mark">{r.key}</span> — {r.message}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

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
/** زرّ خيار — انظر jOption في نظام الجمعية لسبب خلوّ الأساس من الألوان */
export const mOption = (on: boolean) =>
  mBtn +
  " border " +
  (on
    ? "border-m-accent bg-m-accent-soft text-m-accent"
    : "border-m-line bg-m-surface text-m-text hover:bg-m-raised");

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

  /**
   * بلا data-matam: الورقة داخل الجهاز فترث متغيّراته. وإعلانها من
   * جديد يُطبّق عليها قاعدة [data-matam] فتعود الألوان إلى الافتراضي
   * ويُلغى مظهر المدير داخل كل ورقة.
   */
  return (
    <div className="absolute inset-0 z-50 flex items-end overflow-hidden rounded-[inherit]">
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
