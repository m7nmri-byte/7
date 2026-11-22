"use client";

import type { Order } from "../matam/types";
import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, flowFor } from "../matam/status";
import { money, sinceText, timeOf } from "../matam/format";
import { Chip, Empty } from "../matam/ui";

/** شريط تقدّم الطلب عبر مراحله */
function Steps({ order }: { order: Order }) {
  const flow = flowFor(order.order_type);
  const at = flow.indexOf(order.status);

  if (order.status === "cancelled")
    return (
      <p className="rounded-xl bg-m-danger/15 px-3 py-2.5 text-center text-sm text-m-danger">
        أُلغي هذا الطلب
      </p>
    );

  return (
    <ol className="flex flex-col gap-0">
      {flow.map((s, i) => {
        const done = i <= at;
        const current = i === at;
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: done ? STATUS_COLOR[s] : "var(--m-line)",
                  backgroundColor: done ? STATUS_COLOR[s] : "transparent",
                }}
              >
                {current && <span className="size-1.5 rounded-full bg-black/60" />}
              </span>
              {i < flow.length - 1 && (
                <span
                  className="w-0.5 flex-1"
                  style={{ backgroundColor: i < at ? STATUS_COLOR[s] : "var(--m-line)" }}
                />
              )}
            </div>
            <span
              className={`pb-5 text-sm ${current ? "font-semibold text-m-text" : done ? "text-m-dim" : "text-m-faint"}`}
            >
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-4 text-start transition-colors hover:border-m-accent/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="mark text-sm font-semibold tabular-nums">#{order.order_number}</span>
        <Chip color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Chip>
      </div>
      <p className="truncate text-xs text-m-dim">
        {order.items.map((i) => `${i.name} ×${i.quantity}`).join("، ")}
      </p>
      <div className="flex items-center justify-between text-xs text-m-faint">
        <span>{sinceText(order.created_at)}</span>
        <span className="font-semibold text-m-accent">{money(order.total)}</span>
      </div>
    </button>
  );
}

export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="mark text-lg font-semibold tabular-nums">#{order.order_number}</span>
          <span className="text-xs text-m-faint">
            {TYPE_LABEL[order.order_type]} · {timeOf(order.created_at)}
          </span>
        </div>
        <Chip color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Chip>
      </div>

      {order.estimated_minutes ? (
        <p className="rounded-xl bg-m-accent-soft px-3 py-2.5 text-center text-sm text-m-accent">
          الوقت المتوقّع: {order.estimated_minutes} دقيقة
        </p>
      ) : null}

      <Steps order={order} />

      {order.driver_name && (
        <p className="rounded-xl bg-m-raised px-3 py-2.5 text-sm">
          المندوب: <span className="font-medium">{order.driver_name}</span>
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-m-dim">الأصناف</h3>
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between gap-3 rounded-xl bg-m-surface p-3 text-sm">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate">
                {it.name} <span className="mark text-m-faint">×{it.quantity}</span>
              </span>
              {it.options.map((o) => (
                <span key={o.group_id} className="truncate text-[11px] text-m-dim">
                  {o.group_name}: {o.names.join("، ")}
                </span>
              ))}
              {it.note && <span className="text-[11px] text-m-faint">ملاحظة: {it.note}</span>}
            </div>
            <span className="shrink-0 text-m-dim">{money(it.price * it.quantity)}</span>
          </div>
        ))}
      </section>

      {order.delivery_address && (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-m-dim">عنوان التوصيل</h3>
          <p className="text-sm leading-relaxed">{order.delivery_address}</p>
          {order.zone_name && <p className="text-xs text-m-faint">{order.zone_name}</p>}
        </section>
      )}

      {order.notes && (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-m-dim">ملاحظات</h3>
          <p className="text-sm leading-relaxed">{order.notes}</p>
        </section>
      )}

      <dl className="flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-m-dim">المجموع</dt>
          <dd>{money(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">التوصيل</dt>
          <dd>{money(order.delivery_fee)}</dd>
        </div>
        <div className="flex justify-between border-t border-m-line pt-2 font-semibold">
          <dt>الإجمالي</dt>
          <dd className="text-m-accent">{money(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OrdersList({
  orders,
  onOpen,
}: {
  orders: Order[];
  onOpen: (o: Order) => void;
}) {
  if (!orders.length)
    return <Empty title="لا توجد طلبات بعد" hint="طلباتك ستظهر هنا" />;

  return (
    <div className="flex flex-col gap-3 p-4">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onOpen={() => onOpen(o)} />
      ))}
    </div>
  );
}
