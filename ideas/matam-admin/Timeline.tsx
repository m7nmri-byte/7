"use client";

import { useCallback } from "react";
import type { OrderStatus } from "../matam/types";
import { fetchOrderEvents } from "../matam/db";
import { useLive } from "../matam/hooks";
import { STATUS_COLOR, STATUS_LABEL } from "../matam/status";
import { timeOf } from "../matam/format";

/** كم مكث الطلب في كل مرحلة — يكشف أين يضيع الوقت */
export function OrderTimeline({ orderId }: { orderId: string }) {
  const load = useCallback(() => fetchOrderEvents(orderId), [orderId]);
  const { data } = useLive("matam_order_events", load);
  const events = data ?? [];

  if (events.length < 2) return null;

  const gap = (i: number) => {
    if (i === 0) return null;
    const ms = +new Date(events[i].created_at) - +new Date(events[i - 1].created_at);
    const min = Math.round(ms / 60000);
    return min < 1 ? "أقل من دقيقة" : `${min} دقيقة`;
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-m-dim">مسار الطلب</h3>
      <ol className="flex flex-col gap-1.5">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-2.5 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[e.status as OrderStatus] }}
            />
            <span className="flex-1">{STATUS_LABEL[e.status as OrderStatus]}</span>
            {gap(i) && <span className="text-m-faint">{gap(i)}</span>}
            <span className="mark w-14 text-end text-m-faint">{timeOf(e.created_at)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
