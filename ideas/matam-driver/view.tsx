"use client";

import { useCallback, useState } from "react";
import type { Driver, Order } from "../matam/types";
import { fetchDrivers, fetchOrders, updateOrder } from "../matam/db";
import { useLive, useTick } from "../matam/hooks";
import { money, sinceText, timeOf } from "../matam/format";
import { STATUS_COLOR, STATUS_LABEL } from "../matam/status";
import { DataErrorBar, Body, Chip, Empty, Loading, Phone, TabBar, TopBar, mGhost, mPrimary } from "../matam/ui";

type Tab = "available" | "mine" | "done";

const DRIVER_KEY = "matam.driver";

const ICONS = {
  available: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 13h10V7H3zM13 10h4l4 3v3h-8z" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </svg>
  ),
  mine: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  done: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Card({
  order,
  now,
  action,
  onAction,
  onMap,
}: {
  order: Order;
  now: number;
  action?: string;
  onAction?: () => void;
  onMap?: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-m-line bg-m-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="mark text-base font-bold tabular-nums">#{order.order_number}</span>
        <Chip color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Chip>
      </header>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{order.customer_name}</span>
        <a
          href={`tel:${order.customer_phone}`}
          className="mark w-fit text-xs text-m-info"
          dir="ltr"
        >
          {order.customer_phone}
        </a>
        {order.delivery_address && (
          <p className="text-xs leading-relaxed text-m-dim">{order.delivery_address}</p>
        )}
        {order.zone_name && <span className="text-[11px] text-m-faint">{order.zone_name}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-m-faint">
        <span>
          {timeOf(order.created_at)} · {sinceText(order.created_at, now)}
        </span>
        <span className="font-semibold text-m-accent">{money(order.total)}</span>
      </div>

      <div className="flex gap-2">
        {onMap && (order.delivery_address || order.delivery_lat != null) && (
          <button onClick={onMap} className={`${mGhost} flex-1 py-2 text-xs`}>
            افتح الخريطة
          </button>
        )}
        {action && onAction && (
          <button onClick={onAction} className={`${mPrimary} flex-1 py-2 text-xs`}>
            {action}
          </button>
        )}
      </div>
    </article>
  );
}

export default function DriverApp() {
  const now = useTick(30_000);
  const [tab, setTab] = useState<Tab>("available");
  const [driver, setDriver] = useState<Driver | null>(() => {
    try {
      const raw = localStorage.getItem(DRIVER_KEY);
      return raw ? (JSON.parse(raw) as Driver) : null;
    } catch {
      return null;
    }
  });

  const loadDrivers = useCallback(() => fetchDrivers(), []);
  const { data: drivers } = useLive("matam_drivers", loadDrivers);

  const loadOrders = useCallback(() => fetchOrders({ limit: 120 }), []);
  const { data, loading, refresh } = useLive("matam_orders", loadOrders);
  const orders = data ?? [];

  const pick = (d: Driver) => {
    setDriver(d);
    try {
      localStorage.setItem(DRIVER_KEY, JSON.stringify(d));
    } catch {
      /* لا بأس */
    }
  };

  if (!driver) {
    return (
      <Phone>
        <TopBar title="المندوب" subtitle="من أنت؟" />
        <DataErrorBar />
        <Body className="flex flex-col gap-2 p-4">
          {(drivers ?? []).filter((d) => d.is_active).length === 0 ? (
            <Empty title="لا يوجد مندوبون" hint="تُضاف أسماؤهم من تطبيق الإدارة" />
          ) : (
            (drivers ?? [])
              .filter((d) => d.is_active)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => pick(d)}
                  className="rounded-2xl border border-m-line bg-m-surface p-4 text-start text-sm font-medium"
                >
                  {d.name}
                </button>
              ))
          )}
        </Body>
      </Phone>
    );
  }

  // جاهز للتوصيل ولم يُسنَد بعد
  const available = orders.filter(
    (o) => o.order_type === "delivery" && o.status === "ready" && !o.driver_id,
  );
  const mine = orders.filter(
    (o) => o.driver_id === driver.id && o.status === "out_for_delivery",
  );
  const done = orders.filter((o) => o.driver_id === driver.id && o.status === "delivered");

  const take = async (o: Order) => {
    await updateOrder(o.id, {
      driver_id: driver.id,
      driver_name: driver.name,
      status: "out_for_delivery",
    });
    void refresh();
    setTab("mine");
  };

  const deliver = async (o: Order) => {
    await updateOrder(o.id, { status: "delivered", payment_status: "paid" });
    void refresh();
  };

  // الإحداثيات أدقّ من النصّ حين توفّرت
  const openMap = (o: Order) => {
    const q =
      o.delivery_lat != null && o.delivery_lng != null
        ? `${o.delivery_lat},${o.delivery_lng}`
        : encodeURIComponent(o.delivery_address ?? "");
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const list = tab === "available" ? available : tab === "mine" ? mine : done;

  return (
    <Phone
      bar={
        <TabBar<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "available", label: "متاحة", badge: available.length, icon: ICONS.available },
            { key: "mine", label: "معي", badge: mine.length, icon: ICONS.mine },
            { key: "done", label: "سُلّمت", icon: ICONS.done },
          ]}
        />
      }
    >
      <TopBar
        title={driver.name}
        subtitle={`${mine.length} طلب معك`}
        end={
          <button
            onClick={() => {
              setDriver(null);
              try {
                localStorage.removeItem(DRIVER_KEY);
              } catch {
                /* لا بأس */
              }
            }}
            className="text-xs text-m-faint"
          >
            تبديل
          </button>
        }
      />

      <DataErrorBar />

      <Body className="flex flex-col gap-3 p-4">
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty
            title={
              tab === "available"
                ? "لا طلبات جاهزة للتوصيل"
                : tab === "mine"
                  ? "لا طلبات معك الآن"
                  : "لم تسلّم شيئًا بعد"
            }
          />
        ) : (
          list.map((o) => (
            <Card
              key={o.id}
              order={o}
              now={now}
              action={tab === "available" ? "استلمه" : tab === "mine" ? "سُلّم" : undefined}
              onAction={
                tab === "available"
                  ? () => void take(o)
                  : tab === "mine"
                    ? () => void deliver(o)
                    : undefined
              }
              onMap={tab === "done" ? undefined : () => openMap(o)}
            />
          ))
        )}
      </Body>
    </Phone>
  );
}
