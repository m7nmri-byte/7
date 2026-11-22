"use client";

import { useState } from "react";
import type { Driver, Order, OrderStatus } from "../matam/types";
import { updateOrder } from "../matam/db";
import { money, sinceText, timeOf } from "../matam/format";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  TYPE_LABEL,
  isOpenOrder,
} from "../matam/status";
import { Chip, Empty } from "../matam/ui";
import { OrderSheet } from "./OrderSheet";

const FILTERS: { key: string; label: string; match: (s: OrderStatus) => boolean }[] = [
  { key: "open", label: "الجارية", match: isOpenOrder },
  { key: "pending", label: "بانتظار القبول", match: (s) => s === "pending" },
  { key: "delivered", label: "المسلّمة", match: (s) => s === "delivered" },
  { key: "cancelled", label: "الملغاة", match: (s) => s === "cancelled" },
  { key: "all", label: "الكل", match: () => true },
];

export function Orders({
  orders,
  drivers,
  onChanged,
}: {
  orders: Order[];
  drivers: Driver[];
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState("open");
  const [open, setOpen] = useState<Order | null>(null);

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const list = orders.filter((o) => active.match(o.status));

  const apply = async (o: Order, patch: Partial<Order>) => {
    await updateOrder(o.id, patch);
    onChanged();
    setOpen(null);
  };

  return (
    <div className="flex flex-col">
      <div className="m-noscroll flex gap-2 overflow-x-auto border-b border-m-line px-4 py-3">
        {FILTERS.map((f) => {
          const n = orders.filter((o) => f.match(o.status)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                filter === f.key
                  ? "bg-m-accent font-semibold text-[#1a1204]"
                  : "border border-m-line text-m-dim"
              }`}
            >
              {f.label} {n > 0 ? <span className="mark">{n}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 p-4">
        {list.length === 0 ? (
          <Empty title="لا طلبات هنا" />
        ) : (
          list.map((o) => (
            <button
              key={o.id}
              onClick={() => setOpen(o)}
              className="flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-3 text-start"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="mark text-sm font-bold tabular-nums">#{o.order_number}</span>
                <Chip color={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Chip>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-m-dim">
                  {o.customer_name} · {TYPE_LABEL[o.order_type]}
                </span>
                <span className="shrink-0 font-semibold text-m-accent">{money(o.total)}</span>
              </div>
              <span className="text-[11px] text-m-faint">
                {timeOf(o.created_at)} · {sinceText(o.created_at)}
                {o.driver_name ? ` · ${o.driver_name}` : ""}
              </span>
            </button>
          ))
        )}
      </div>

      <OrderSheet
        order={open}
        drivers={drivers}
        onClose={() => setOpen(null)}
        onApply={apply}
      />
    </div>
  );
}
