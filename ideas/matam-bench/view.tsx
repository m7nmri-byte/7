"use client";

import { useState } from "react";
import { PhoneBench } from "../matam/ui";
import CustomerApp from "../matam-customer/view";
import KitchenApp from "../matam-kitchen/view";
import AdminApp from "../matam-admin/view";
import DriverApp from "../matam-driver/view";

type Key = "customer" | "kitchen" | "admin" | "driver";

const APPS: { key: Key; label: string; node: React.ReactNode; tint: string }[] = [
  { key: "customer", label: "العميل", node: <CustomerApp />, tint: "#d1492a" },
  { key: "kitchen", label: "المطبخ", node: <KitchenApp />, tint: "#2e7d57" },
  { key: "admin", label: "الإدارة", node: <AdminApp />, tint: "#2f6fa8" },
  { key: "driver", label: "المندوب", node: <DriverApp />, tint: "#b8791a" },
];

/**
 * منصّة الأجهزة: تشغيل عدة واجهات جنبًا إلى جنب على شاشة واحدة.
 * كل جهاز نسخة حيّة كاملة لا صورة، فالطلب الذي يُنشأ في جهاز العميل
 * يظهر في جهاز المطبخ أمامك في اللحظة نفسها.
 */
export default function Bench() {
  const [on, setOn] = useState<Key[]>(["customer", "kitchen"]);

  const toggle = (k: Key) =>
    setOn((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const shown = APPS.filter((a) => on.includes(a.key));

  return (
    <div className="flex min-h-dvh flex-col bg-[#15110f] text-[#efe9e3]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#2a2420] px-5 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold">منصّة الأجهزة</h1>
          <span className="text-xs text-[#8e837b]">شغّل الواجهات معًا وتابع الطلب بينها</span>
        </div>

        <div className="ms-auto flex flex-wrap gap-1.5">
          {APPS.map((a) => {
            const active = on.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggle(a.key)}
                aria-pressed={active}
                className="rounded-full px-3.5 py-1.5 text-xs transition-colors"
                style={
                  active
                    ? { backgroundColor: a.tint, color: "#fff" }
                    : { border: "1px solid #332c27", color: "#9a8f86" }
                }
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </header>

      {shown.length === 0 ? (
        <p className="m-auto text-sm text-[#8e837b]">اختر واجهة أو أكثر من الأعلى</p>
      ) : (
        <div className="flex flex-1 items-stretch gap-5 overflow-x-auto p-5">
          {shown.map((a) => (
            <section
              key={a.key}
              className="flex h-[min(46rem,calc(100dvh-7rem))] w-[23rem] shrink-0 flex-col gap-2"
            >
              <div className="flex items-center gap-2 px-1">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: a.tint }}
                />
                <span className="text-xs text-[#9a8f86]">{a.label}</span>
              </div>
              <div className="min-h-0 flex-1">
                <PhoneBench value="embedded">{a.node}</PhoneBench>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
