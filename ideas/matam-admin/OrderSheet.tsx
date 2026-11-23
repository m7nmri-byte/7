"use client";

import type { Driver, Order, PaymentStatus, Settings } from "../matam/types";
import { money } from "../matam/format";
import {
  ADVANCE_LABEL,
  PAYMENT_LABEL,
  TYPE_LABEL,
  isOpenOrder,
  nextStatus,
} from "../matam/status";
import { MSheet, mField, mGhost, mPrimary } from "../matam/ui";
import { useState } from "react";
import { printOrder } from "../matam/print";
import { OrderTimeline } from "./Timeline";

/** تفاصيل الطلب وكل ما يمكن للإدارة تغييره فيه */
export function OrderSheet({
  order,
  drivers,
  settings,
  onClose,
  onApply,
}: {
  order: Order | null;
  drivers: Driver[];
  settings: Settings | null;
  onClose: () => void;
  onApply: (o: Order, patch: Partial<Order>) => void;
}) {
  const [reason, setReason] = useState("");

  if (!order) return null;

  const next = nextStatus(order.status, order.order_type);
  const advance = ADVANCE_LABEL[order.status];

  return (
    <MSheet
      open
      onClose={onClose}
      title={`طلب #${order.order_number}`}
      footer={
        <div className="flex flex-wrap gap-2">
          {next && advance && (
            <button
              onClick={() => onApply(order, { status: next })}
              className={`${mPrimary} flex-1`}
            >
              {advance}
            </button>
          )}
          <button onClick={() => printOrder(order, settings, "receipt")} className={mGhost}>
            طباعة
          </button>
          {isOpenOrder(order.status) && (
            <button
              onClick={() =>
                onApply(order, {
                  status: "cancelled",
                  cancel_reason: reason.trim() || null,
                })
              }
              className={mGhost}
            >
              إلغاء
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <section className="flex flex-col gap-1">
          <span className="font-medium">{order.customer_name}</span>
          <a href={`tel:${order.customer_phone}`} dir="ltr" className="mark text-xs text-m-info">
            {order.customer_phone}
          </a>
          <span className="text-xs text-m-faint">
            {TYPE_LABEL[order.order_type]} · {PAYMENT_LABEL[order.payment_status]}
          </span>
        </section>

        {order.delivery_address && (
          <section className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-m-dim">العنوان</h3>
            <p className="text-xs leading-relaxed">{order.delivery_address}</p>
            {order.zone_name && <span className="text-[11px] text-m-faint">{order.zone_name}</span>}
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-m-dim">الأصناف</h3>
          {order.items.map((it, i) => (
            <div
              key={i}
              className="flex justify-between gap-2 rounded-lg bg-m-raised p-2.5 text-xs"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">
                  {it.name} <span className="mark">×{it.quantity}</span>
                </span>
                {it.options.map((op) => (
                  <span key={op.group_id} className="truncate text-m-dim">
                    {op.group_name}: {op.names.join("، ")}
                  </span>
                ))}
                {it.note && <span className="text-m-warn">{it.note}</span>}
              </span>
              <span className="shrink-0 text-m-dim">{money(it.price * it.quantity)}</span>
            </div>
          ))}
        </section>

        {order.notes && (
          <section className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-m-dim">ملاحظات الزبون</h3>
            <p className="text-xs leading-relaxed">{order.notes}</p>
          </section>
        )}

        {order.order_type === "delivery" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-m-dim">المندوب</span>
            <select
              className={mField}
              value={order.driver_id ?? ""}
              onChange={(e) => {
                const d = drivers.find((x) => x.id === e.target.value) ?? null;
                onApply(order, { driver_id: d?.id ?? null, driver_name: d?.name ?? null });
              }}
            >
              <option value="">— بلا مندوب —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-m-dim">حالة الدفع</span>
          <select
            className={mField}
            value={order.payment_status}
            onChange={(e) =>
              onApply(order, { payment_status: e.target.value as PaymentStatus })
            }
          >
            {(["pending", "paid", "failed", "refunded"] as const).map((p) => (
              <option key={p} value={p}>
                {PAYMENT_LABEL[p]}
              </option>
            ))}
          </select>
        </label>

        {isOpenOrder(order.status) && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-m-dim">سبب الإلغاء — يُحفظ مع الطلب</span>
            <input
              className={mField}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: الصنف غير متوفر"
            />
          </label>
        )}

        {order.cancel_reason && (
          <p className="rounded-xl bg-m-danger/10 px-3 py-2.5 text-xs text-m-danger">
            سبب الإلغاء: {order.cancel_reason}
          </p>
        )}

        {order.rating !== null && (
          <p className="rounded-xl bg-m-raised px-3 py-2.5 text-xs">
            تقييم الزبون: <b className="mark">{order.rating}/5</b>
            {order.rating_note ? " — " + order.rating_note : ""}
          </p>
        )}

        <OrderTimeline orderId={order.id} />

        <dl className="flex flex-col gap-1.5 rounded-xl bg-m-raised p-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-m-dim">المجموع</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-m-dim">التوصيل</dt>
            <dd>{money(order.delivery_fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-m-line pt-1.5 font-semibold">
            <dt>الإجمالي</dt>
            <dd className="text-m-accent">{money(order.total)}</dd>
          </div>
        </dl>
      </div>
    </MSheet>
  );
}
