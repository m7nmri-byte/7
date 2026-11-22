"use client";

import type { ReactNode } from "react";

/** إطار موحّد لكل رسم */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-edge bg-card p-5 sm:p-6">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function Empty({ msg = "لا توجد بيانات بعد" }: { msg?: string }) {
  return <p className="py-6 text-center text-xs text-faint">{msg}</p>;
}

/** جملة استبصار فوق الرسم */
export function Take({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm leading-relaxed text-ink">{children}</p>;
}

export type Stat = { n: ReactNode; l: string; word?: boolean };

export function StatRow({ items, caption }: { items: Stat[]; caption?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {items.map((i, k) => (
          <div key={k} className="flex flex-col gap-0.5">
            <span className={`text-2xl text-ink ${i.word ? "" : "mark tabular-nums"}`}>
              {i.n}
            </span>
            <span className="text-xs text-faint">{i.l}</span>
          </div>
        ))}
      </div>
      {caption && <p className="truncate text-[11px] text-muted">{caption}</p>}
    </div>
  );
}

/** شريط نِسَب مكدّس */
export function Stack({
  parts,
}: {
  parts: { key: string; value: number; color: string; label: string }[];
}) {
  const shown = parts.filter((p) => p.value > 0);
  if (!shown.length) return null;
  return (
    <div className="flex h-3.5 overflow-hidden rounded-full bg-paper">
      {shown.map((p) => (
        <span
          key={p.key}
          title={p.label}
          style={{ flex: p.value, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { key: string; color: string; label: string; sub?: string; value?: string; count?: string }[];
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-2.5 text-xs">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          <span className="flex-1 text-muted">
            {i.label}
            {i.sub && <span className="ms-1.5 text-faint">{i.sub}</span>}
          </span>
          {i.value && <b className="mark font-medium tabular-nums text-ink">{i.value}</b>}
          {i.count && <span className="w-20 text-end text-faint">{i.count}</span>}
        </li>
      ))}
    </ul>
  );
}
