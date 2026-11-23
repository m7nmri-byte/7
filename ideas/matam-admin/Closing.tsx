"use client";

import { useMemo, useState } from "react";
import type { Order } from "../matam/types";
import { money } from "../matam/format";
import { STATUS_LABEL } from "../matam/status";
import { mGhost } from "../matam/ui";

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** صفّ في التقرير: اسم وعدد ومبلغ */
function Row({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total?: number;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-m-line-soft py-2.5 last:border-0">
      <span className="text-sm text-m-dim">{label}</span>
      <span className="flex items-baseline gap-3">
        <span className="mark text-xs text-m-faint">{count}</span>
        {total !== undefined && (
          <span
            className="mark text-sm font-semibold"
            style={tone ? { color: tone } : undefined}
          >
            {money(total)}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * تقرير الإغلاق: ما يُقرأ آخر اليوم قبل إقفال الصندوق.
 * يفصل المحصّل عن المعلّق، فتعرف كم في الدرج وكم ما زال في الطريق.
 */
export function Closing({ orders }: { orders: Order[] }) {
  const [day, setDay] = useState(() => dayKey(new Date().toISOString()));

  const days = useMemo(() => {
    const set = new Set(orders.map((o) => dayKey(o.created_at)));
    set.add(dayKey(new Date().toISOString()));
    return [...set].sort().reverse().slice(0, 30);
  }, [orders]);

  const r = useMemo(() => {
    const list = orders.filter((o) => dayKey(o.created_at) === day);
    const by = (f: (o: Order) => boolean) => {
      const sel = list.filter(f);
      return { count: sel.length, total: sel.reduce((s, o) => s + Number(o.total), 0) };
    };

    const delivered = by((o) => o.status === "delivered");
    const paid = by((o) => o.status === "delivered" && o.payment_status === "paid");
    const unpaid = by((o) => o.status === "delivered" && o.payment_status !== "paid");
    const cancelled = by((o) => o.status === "cancelled");
    const open = by((o) => o.status !== "delivered" && o.status !== "cancelled");
    const refunded = by((o) => o.payment_status === "refunded");
    const pickup = by((o) => o.order_type === "pickup" && o.status === "delivered");
    const deliveryFees = list
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + Number(o.delivery_fee), 0);

    const byStatus = (
      ["pending", "confirmed", "preparing", "ready", "out_for_delivery"] as const
    )
      .map((st) => ({ st, n: list.filter((o) => o.status === st).length }))
      .filter((x) => x.n > 0);

    return {
      all: list.length,
      delivered,
      paid,
      unpaid,
      cancelled,
      open,
      refunded,
      pickup,
      deliveryFees,
      byStatus,
      avg: delivered.count ? delivered.total / delivered.count : 0,
    };
  }, [orders, day]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <select
        className="w-full rounded-xl border border-m-line bg-m-surface px-3 py-2.5 text-sm outline-none"
        value={day}
        onChange={(e) => setDay(e.target.value)}
      >
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <section className="rounded-2xl border border-m-line bg-m-surface p-4">
        <h2 className="mb-1 text-xs font-semibold text-m-dim">المحصّل</h2>
        <Row label="مدفوع ومسلّم" count={r.paid.count} total={r.paid.total} tone="var(--m-ok)" />
        <Row label="مسلّم بلا دفع" count={r.unpaid.count} total={r.unpaid.total} tone="var(--m-warn)" />
        <Row label="مُسترجَع" count={r.refunded.count} total={r.refunded.total} tone="var(--m-danger)" />
      </section>

      <section className="rounded-2xl border border-m-line bg-m-surface p-4">
        <h2 className="mb-1 text-xs font-semibold text-m-dim">الحركة</h2>
        <Row label="إجمالي الطلبات" count={r.all} />
        <Row label="سُلّمت" count={r.delivered.count} total={r.delivered.total} />
        <Row label="منها استلام من المطعم" count={r.pickup.count} total={r.pickup.total} />
        <Row label="ما زالت جارية" count={r.open.count} total={r.open.total} tone="var(--m-info)" />
        <Row label="أُلغيت" count={r.cancelled.count} total={r.cancelled.total} />
        <Row label="رسوم التوصيل المحصّلة" count={r.delivered.count} total={r.deliveryFees} />
        <Row label="متوسط الطلب" count={r.delivered.count} total={r.avg} />
      </section>

      {r.byStatus.length > 0 && (
        <section className="rounded-2xl border border-m-warn/40 bg-m-surface p-4">
          <h2 className="mb-1 text-xs font-semibold text-m-warn">لم تُغلق بعد</h2>
          {r.byStatus.map((x) => (
            <Row key={x.st} label={STATUS_LABEL[x.st]} count={x.n} />
          ))}
        </section>
      )}

      <button onClick={() => window.print()} className={mGhost}>
        طباعة التقرير
      </button>
    </div>
  );
}
