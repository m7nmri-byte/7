"use client";

import { useCallback, useState } from "react";
import type { Order, OrderStatus } from "../matam/types";
import { fetchOrders, updateOrder } from "../matam/db";
import { useLive, useTick } from "../matam/hooks";
import { sinceText } from "../matam/format";
import { TYPE_LABEL, nextStatus } from "../matam/status";
import {
  Body,
  Empty,
  Loading,
  MSheet,
  Phone,
  TabBar,
  TopBar,
  mField,
  mGhost,
  mPrimary,
} from "../matam/ui";
import { printOrder } from "../matam/print";
import { fetchSettings } from "../matam/db";
import { KitchenTicket } from "./Ticket";
import { useOrderAlerts } from "./useAlerts";

type Tab = "queue" | "ready";

const KITCHEN: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

const ICONS = {
  queue: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 7h14l-1.2 12H6.2z" strokeLinejoin="round" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  ),
  ready: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function KitchenApp() {
  const now = useTick(15_000);
  const [tab, setTab] = useState<Tab>("queue");
  const [open, setOpen] = useState<Order | null>(null);
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => fetchOrders({ statuses: KITCHEN, limit: 80 }), []);
  const { data: settings } = useLive("matam_settings", fetchSettings);
  const { data, loading, refresh } = useLive("matam_orders", load);
  const orders = data ?? [];

  // التنبيه يحتاج تفاعلًا واحدًا من المستخدم قبل أن يسمح به المتصفح
  const { ready: alertsOn, enable: enableAlerts } = useOrderAlerts(orders, true);

  const queue = orders
    .filter((o) => o.status !== "ready")
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const ready = orders.filter((o) => o.status === "ready");
  const list = tab === "queue" ? queue : ready;

  // المطبخ يقف عند «جاهز» — ما بعدها للتوصيل أو الاستلام
  const advance = async (o: Order) => {
    if (o.status === "ready") return;
    const next = nextStatus(o.status, o.order_type);
    if (!next) return;
    await updateOrder(o.id, { status: next });
    void refresh();
  };

  const save = async () => {
    if (!open) return;
    await updateOrder(open.id, {
      estimated_minutes: minutes ? Number(minutes) : null,
      estimated_set_at: minutes ? new Date().toISOString() : null,
      kitchen_notes: note.trim() || null,
    });
    setOpen(null);
    void refresh();
  };

  const cancel = async () => {
    if (!open) return;
    await updateOrder(open.id, { status: "cancelled" });
    setOpen(null);
    void refresh();
  };

  return (
    <Phone
      bar={
        <TabBar<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "queue", label: "قيد العمل", badge: queue.length, icon: ICONS.queue },
            { key: "ready", label: "جاهزة", badge: ready.length, icon: ICONS.ready },
          ]}
        />
      }
    >
      <TopBar
        title="المطبخ"
        subtitle={`${queue.length} قيد العمل · ${ready.length} جاهزة`}
        end={
          alertsOn ? (
            <span
              title="التنبيه مفعّل"
              aria-label="التنبيه مفعّل"
              className="grid size-9 place-items-center rounded-full text-m-ok"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" strokeLinejoin="round" />
                <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            <button
              onClick={() => void enableAlerts()}
              className="rounded-full bg-m-accent px-3 py-1.5 text-xs font-bold text-white"
            >
              فعّل التنبيه
            </button>
          )
        }
      />

      <Body className="flex flex-col gap-3 p-4">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty
            title={tab === "queue" ? "لا طلبات الآن" : "لا طلبات جاهزة"}
            hint={tab === "queue" ? "تظهر هنا لحظة وصولها" : undefined}
          />
        ) : (
          list.map((o) => (
            <KitchenTicket
              key={o.id}
              order={o}
              now={now}
              onAdvance={() => void advance(o)}
              onOpen={() => {
                setOpen(o);
                setMinutes(o.estimated_minutes ? String(o.estimated_minutes) : "");
                setNote(o.kitchen_notes ?? "");
              }}
            />
          ))
        )}
      </Body>

      <MSheet
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `طلب #${open.order_number}` : ""}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            <button
              onClick={() => open && printOrder(open, settings ?? null, "kitchen")}
              className={mGhost}
            >
              طباعة
            </button>
            <button onClick={() => void cancel()} className={mGhost}>
              إلغاء
            </button>
          </div>
        }
      >
        {open && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-m-faint">
              وصل {sinceText(open.created_at, now)} · {TYPE_LABEL[open.order_type]}
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">الوقت المتوقّع (دقيقة)</span>
              <input
                className={`${mField} mark`}
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
                placeholder="20"
              />
              <span className="text-[11px] text-m-faint">يظهر للزبون في شاشة التتبّع</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">ملاحظة داخلية</span>
              <textarea
                className={`${mField} min-h-20 resize-none`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="لا تظهر للزبون"
              />
            </label>
          </div>
        )}
      </MSheet>
    </Phone>
  );
}
