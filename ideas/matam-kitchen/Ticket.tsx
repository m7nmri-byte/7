"use client";

import type { Order } from "../matam/types";
import { minutesSince, timeOf } from "../matam/format";
import { ADVANCE_LABEL, STATUS_COLOR, STATUS_LABEL, TYPE_LABEL } from "../matam/status";
import { Chip, mPrimary } from "../matam/ui";

/** لون يشتدّ مع طول الانتظار — يلفت النظر لما تأخّر */
function ageColor(minutes: number) {
  if (minutes >= 25) return "var(--m-danger)";
  if (minutes >= 12) return "var(--m-warn)";
  return "var(--m-dim)";
}

export function KitchenTicket({
  order,
  now,
  onAdvance,
  onOpen,
}: {
  order: Order;
  now: number;
  onAdvance: () => void;
  onOpen: () => void;
}) {
  const age = minutesSince(order.created_at, now);
  const label = order.status === "ready" ? null : ADVANCE_LABEL[order.status];

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-m-line bg-m-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <button onClick={onOpen} className="flex items-center gap-2">
          <span className="mark text-lg font-bold tabular-nums">#{order.order_number}</span>
          <Chip color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Chip>
        </button>
        <span
          className="mark text-sm font-semibold tabular-nums"
          style={{ color: ageColor(age) }}
        >
          {age}د
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {order.items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="mark mt-0.5 shrink-0 rounded bg-m-raised px-1.5 text-xs font-bold tabular-nums text-m-accent">
              {it.quantity}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{it.name}</span>
              {it.options.map((o) =>
                o.kitchen ? (
                  // خيار يغيّر طريقة التحضير — يُقرأ من مسافة
                  <span
                    key={o.group_id}
                    className="mt-0.5 w-fit rounded-md bg-m-accent-soft px-1.5 py-0.5 text-xs font-bold text-m-accent"
                  >
                    {o.group_name}: {o.names.join("، ")}
                  </span>
                ) : (
                  <span key={o.group_id} className="text-xs text-m-dim">
                    {o.group_name}: {o.names.join("، ")}
                  </span>
                ),
              )}
              {it.note && <span className="text-xs font-medium text-m-warn">{it.note}</span>}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="rounded-lg bg-m-raised px-2.5 py-2 text-xs text-m-dim">
          ملاحظة الزبون: {order.notes}
        </p>
      )}

      <footer className="flex items-center gap-2">
        <span className="flex-1 text-xs text-m-faint">
          {TYPE_LABEL[order.order_type]} · {timeOf(order.created_at)}
        </span>
        {label && (
          <button onClick={onAdvance} className={`${mPrimary} px-4 py-2`}>
            {label}
          </button>
        )}
      </footer>
    </article>
  );
}
