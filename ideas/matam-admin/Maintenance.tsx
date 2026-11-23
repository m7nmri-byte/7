"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Order } from "../matam/types";
import { money } from "../matam/format";
import { MSheet, mDanger, mGhost } from "../matam/ui";

type Job = {
  key: string;
  label: string;
  hint: string;
  danger: boolean;
  count: (orders: Order[]) => number;
  run: () => Promise<void>;
};

const since = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * صيانة السجلات.
 * كل إجراء يعرض عدد ما سيمسّه قبل التنفيذ، ويطلب تأكيدًا — فالحذف
 * هنا نهائي ولا تراجع فيه.
 */
const JOBS: Job[] = [
  {
    key: "old",
    label: "حذف الطلبات المنتهية الأقدم من ٩٠ يومًا",
    hint: "تنظيف دوري يبقي النظام سريعًا",
    danger: false,
    count: (o) =>
      o.filter(
        (x) =>
          (x.status === "delivered" || x.status === "cancelled") &&
          x.created_at < since(90),
      ).length,
    run: async () => {
      await supabase
        .from("matam_orders")
        .delete()
        .in("status", ["delivered", "cancelled"])
        .lt("created_at", since(90));
    },
  },
  {
    key: "cancelled",
    label: "حذف الطلبات الملغاة",
    hint: "لا تدخل التقارير أصلًا",
    danger: false,
    count: (o) => o.filter((x) => x.status === "cancelled").length,
    run: async () => {
      await supabase.from("matam_orders").delete().eq("status", "cancelled");
    },
  },
  {
    key: "tickets",
    label: "حذف تذاكر الدعم المغلقة",
    hint: "مع رسائلها",
    danger: false,
    count: () => 0,
    run: async () => {
      await supabase.from("matam_tickets").delete().eq("status", "closed");
    },
  },
  {
    key: "all-orders",
    label: "حذف كل الطلبات",
    hint: "يمسح السجل كاملًا — لا تراجع",
    danger: true,
    count: (o) => o.length,
    run: async () => {
      await supabase.from("matam_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    },
  },
];

export function Maintenance({
  orders,
  onChanged,
}: {
  orders: Order[];
  onChanged: () => void;
}) {
  const [confirm, setConfirm] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const delivered = orders.filter((o) => o.status === "delivered");
  const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <dl className="flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-m-dim">إجمالي الطلبات المحفوظة</dt>
          <dd className="mark font-semibold">{orders.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">منها مسلّمة</dt>
          <dd className="mark font-semibold">{delivered.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">إيراداتها</dt>
          <dd className="mark font-semibold text-m-accent">{money(revenue)}</dd>
        </div>
      </dl>

      {JOBS.map((j) => {
        const n = j.count(orders);
        return (
          <button
            key={j.key}
            onClick={() => setConfirm(j)}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-start ${
              j.danger ? "border-m-danger/40" : "border-m-line bg-m-surface"
            }`}
          >
            <span className="flex min-w-0 flex-col">
              <span className={`text-sm ${j.danger ? "text-m-danger" : ""}`}>{j.label}</span>
              <span className="text-[11px] text-m-faint">{j.hint}</span>
            </span>
            {n > 0 && <span className="mark shrink-0 text-xs text-m-dim">{n}</span>}
          </button>
        );
      })}

      <MSheet
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="تأكيد الحذف"
        footer={
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={async () => {
                if (!confirm) return;
                setBusy(true);
                await confirm.run();
                setBusy(false);
                setConfirm(null);
                onChanged();
              }}
              className={`${mDanger} flex-1`}
            >
              {busy ? "جارٍ الحذف…" : "نعم، احذف"}
            </button>
            <button onClick={() => setConfirm(null)} className={mGhost}>
              تراجع
            </button>
          </div>
        }
      >
        {confirm && (
          <p className="text-sm leading-relaxed">
            {confirm.label}
            {confirm.count(orders) > 0 && (
              <>
                {" — "}
                <b className="mark">{confirm.count(orders)}</b> سجلًّا
              </>
            )}
            . لا يمكن التراجع عن هذا.
          </p>
        )}
      </MSheet>
    </div>
  );
}
