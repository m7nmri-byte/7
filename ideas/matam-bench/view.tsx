"use client";

import { PhoneBench } from "../matam/ui";
import { ErrorBoundary } from "../matam/ErrorBoundary";
import { DEVICES, type DeviceKey, useDevices } from "./devices";
import CustomerApp from "../matam-customer/view";
import KitchenApp from "../matam-kitchen/view";
import AdminApp from "../matam-admin/view";
import DriverApp from "../matam-driver/view";

const NODES: Record<DeviceKey, React.ReactNode> = {
  customer: <CustomerApp />,
  kitchen: <KitchenApp />,
  admin: <AdminApp />,
  driver: <DriverApp />,
};

/**
 * منصّة الأجهزة: الواجهات الأربع جنبًا إلى جنب على شاشة واحدة.
 * كل جهاز نسخة حيّة لا صورة — فالطلب الذي يُنشأ في جهاز العميل
 * يظهر في جهاز المطبخ أمامك في اللحظة نفسها.
 * ما يُعرض تحدّده القائمة الجانبية عبر ?d= فيبقى قابلًا للمشاركة.
 */
export default function Bench() {
  const active = useDevices();
  const shown = DEVICES.filter((d) => active.includes(d.key));

  return (
    <div className="flex min-h-dvh flex-col bg-[#15110f] text-[#efe9e3]">
      <header className="flex items-baseline gap-2 border-b border-[#2a2420] px-5 py-3">
        <h1 className="text-sm font-semibold">منصّة الأجهزة</h1>
        <span className="text-xs text-[#8e837b]">
          شغّل الواجهات معًا وتابع الطلب بينها
        </span>
      </header>

      {shown.length === 0 ? (
        <p className="m-auto px-6 text-center text-sm text-[#8e837b]">
          اختر واجهة أو أكثر من القائمة الجانبية
        </p>
      ) : (
        <div className="flex flex-1 items-stretch gap-5 overflow-x-auto p-5">
          {shown.map((d) => (
            <section
              key={d.key}
              className="flex h-[min(46rem,calc(100dvh-7rem))] w-[23rem] shrink-0 flex-col gap-2"
            >
              <div className="flex items-center gap-2 px-1">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: d.tint }}
                />
                <span className="text-xs text-[#9a8f86]">{d.label}</span>
              </div>
              <div className="min-h-0 flex-1">
                <PhoneBench value="embedded">
                  <ErrorBoundary label={d.label}>{NODES[d.key]}</ErrorBoundary>
                </PhoneBench>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

