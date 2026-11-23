"use client";

import type { Order, Settings } from "../matam/types";
import { money } from "../matam/format";
import { isOpenOrder } from "../matam/status";
import { saveSettings } from "../matam/db";
import { useSaver } from "../matam/hooks";

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-m-line bg-m-surface p-4">
      <span
        className="mark text-xl font-bold tabular-nums"
        style={{ color: tone ?? "var(--m-text)" }}
      >
        {value}
      </span>
      <span className="text-[11px] text-m-dim">{label}</span>
    </div>
  );
}

/** لوحة سريعة: حالة المطعم اليوم وأهم أرقامه */
export function Home({
  orders,
  settings,
  now,
  onChanged,
  onGoOrders,
}: {
  orders: Order[];
  settings: Settings | null;
  now: number;
  onChanged: () => void;
  onGoOrders: () => void;
}) {
  const since = now - 86_400_000;
  const today = orders.filter((o) => +new Date(o.created_at) >= since);
  const delivered = today.filter((o) => o.status === "delivered");
  const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);
  const live = orders.filter((o) => isOpenOrder(o.status));
  const waiting = orders.filter((o) => o.status === "pending");

  const saveState = useSaver();

  const toggle = (patch: Partial<Settings>) =>
    saveState.run(async () => {
      await saveSettings(patch);
      onChanged();
    });

  return (
    <div className="flex flex-col gap-4 p-4">
      {saveState.error && (
        <p className="rounded-xl bg-m-danger/15 px-3 py-2.5 text-xs text-m-danger">
          {saveState.error}
        </p>
      )}
      <section className="flex flex-col gap-3 rounded-2xl border border-m-line bg-m-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {settings?.restaurant_name || "المطعم"}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: settings?.is_open ? "var(--m-ok)" : "var(--m-danger)" }}
          >
            {settings?.is_open ? "مفتوح" : "مغلق"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void toggle({ is_open: !settings?.is_open })}
            className="flex-1 rounded-xl border border-m-line py-2.5 text-xs transition-colors hover:bg-m-raised"
          >
            {settings?.is_open ? "أغلق المطعم" : "افتح المطعم"}
          </button>
          <button
            onClick={() => void toggle({ allow_orders: !settings?.allow_orders })}
            className="flex-1 rounded-xl border border-m-line py-2.5 text-xs transition-colors hover:bg-m-raised"
          >
            {settings?.allow_orders ? "أوقف الطلبات" : "استقبل الطلبات"}
          </button>
        </div>
      </section>

      {waiting.length > 0 && (
        <button
          onClick={onGoOrders}
          className="rounded-2xl bg-m-accent px-4 py-3 text-sm font-semibold text-[#ffffff]"
        >
          {waiting.length} طلب بانتظار القبول
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile label="إيراد اليوم" value={money(revenue)} tone="var(--m-accent)" />
        <Tile label="طلبات اليوم" value={String(today.length)} />
        <Tile label="جارية الآن" value={String(live.length)} tone="var(--m-info)" />
        <Tile label="سُلّمت اليوم" value={String(delivered.length)} tone="var(--m-ok)" />
      </div>
    </div>
  );
}
