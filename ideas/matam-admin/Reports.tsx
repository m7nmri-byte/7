"use client";

import { useMemo, useState } from "react";
import type { Order } from "../matam/types";
import { money } from "../matam/format";
import { Empty } from "../matam/ui";

type Range = "today" | "week" | "month" | "all";

const RANGES: { key: Range; label: string; days: number }[] = [
  { key: "today", label: "اليوم", days: 1 },
  { key: "week", label: "أسبوع", days: 7 },
  { key: "month", label: "شهر", days: 30 },
  { key: "all", label: "الكل", days: 36500 },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-m-surface p-3">
      <span className="mark text-lg font-bold tabular-nums text-m-text">{value}</span>
      <span className="text-[11px] text-m-dim">{label}</span>
    </div>
  );
}

export function Reports({ orders, now }: { orders: Order[]; now: number }) {
  const [range, setRange] = useState<Range>("today");

  const stats = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 1;
    const from = now - days * 86_400_000;
    const inRange = orders.filter((o) => +new Date(o.created_at) >= from);

    const delivered = inRange.filter((o) => o.status === "delivered");
    const cancelled = inRange.filter((o) => o.status === "cancelled");
    const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);

    // الأكثر مبيعًا: يُجمع عبر الأصناف داخل الطلبات المسلّمة
    const sold = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of delivered)
      for (const it of o.items) {
        const cur = sold.get(it.item_id) ?? { name: it.name, qty: 0, total: 0 };
        cur.qty += it.quantity;
        cur.total += it.price * it.quantity;
        sold.set(it.item_id, cur);
      }

    const byZone = new Map<string, number>();
    for (const o of delivered)
      if (o.zone_name) byZone.set(o.zone_name, (byZone.get(o.zone_name) ?? 0) + 1);

    return {
      count: inRange.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      revenue,
      avg: delivered.length ? revenue / delivered.length : 0,
      top: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
      zones: [...byZone.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [orders, range, now]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs transition-colors ${
              range === r.key
                ? "bg-m-accent font-semibold text-[#1a1204]"
                : "border border-m-line text-m-dim"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="الإيرادات" value={money(stats.revenue)} />
        <Stat label="متوسط الطلب" value={money(stats.avg)} />
        <Stat label="طلبات" value={String(stats.count)} />
        <Stat label="سُلّمت" value={String(stats.delivered)} />
        <Stat label="أُلغيت" value={String(stats.cancelled)} />
        <Stat
          label="نسبة الإلغاء"
          value={stats.count ? `${Math.round((stats.cancelled / stats.count) * 100)}٪` : "—"}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-m-dim">الأكثر مبيعًا</h2>
        {stats.top.length === 0 ? (
          <Empty title="لا مبيعات في هذه الفترة" />
        ) : (
          stats.top.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between gap-3 rounded-xl bg-m-surface p-3 text-sm"
            >
              <span className="truncate">{t.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="mark text-xs text-m-dim">×{t.qty}</span>
                <span className="text-xs font-semibold text-m-accent">{money(t.total)}</span>
              </span>
            </div>
          ))
        )}
      </section>

      {stats.zones.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-m-dim">المناطق الأكثر طلبًا</h2>
          {stats.zones.map(([name, n]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-xl bg-m-surface p-3 text-sm"
            >
              <span className="truncate">{name}</span>
              <span className="mark text-xs text-m-dim">{n} طلب</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
