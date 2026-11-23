"use client";

import { useState } from "react";
import type { DayHours, Settings as S } from "../matam/types";
import { saveSettings } from "../matam/db";
import { useSaver } from "../matam/hooks";
import { MapPicker } from "../matam/MapPicker";
import { ImageField } from "../matam/ImageField";
import { DAY_NAMES } from "../matam/format";
import { mField, mGhost, mPrimary } from "../matam/ui";

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

const defaultHours = (): DayHours[] =>
  Array.from({ length: 7 }, (_, day) => ({
    day,
    closed: false,
    shifts: [{ open: "12:00", close: "23:59" }],
  }));

export function SettingsScreen({
  settings,
  onChanged,
}: {
  settings: S | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<S | null>(settings);
  const saveState = useSaver();

  // أول تحميل يصل بعد التركيب، فنأخذ نسخته مرة واحدة
  if (!draft && settings) setDraft(settings);
  if (!draft) return <div className="p-4 text-sm text-m-dim">…</div>;

  const set = (p: Partial<S>) => {
    setDraft({ ...draft, ...p });
    saveState.touch();
  };

  const hours = draft.work_hours?.length ? draft.work_hours : defaultHours();

  const setDay = (day: number, p: Partial<DayHours>) =>
    set({ work_hours: hours.map((h) => (h.day === day ? { ...h, ...p } : h)) });

  const save = () =>
    saveState.run(async () => {
      await saveSettings(draft);
      onChanged();
    });

  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-m-dim">المطعم</h2>
        <input
          className={mField}
          value={draft.restaurant_name}
          onChange={(e) => set({ restaurant_name: e.target.value })}
          placeholder="اسم المطعم"
        />
        <textarea
          className={`${mField} min-h-16 resize-none`}
          value={draft.welcome_message ?? ""}
          onChange={(e) => set({ welcome_message: e.target.value || null })}
          placeholder="رسالة ترحيب تظهر للزبون"
        />
        <input
          className={mField}
          value={draft.address ?? ""}
          onChange={(e) => set({ address: e.target.value || null })}
          placeholder="العنوان"
        />
        <input
          className={`${mField} mark`}
          dir="ltr"
          value={draft.restaurant_phone ?? ""}
          onChange={(e) => set({ restaurant_phone: e.target.value || null })}
          placeholder="هاتف المطعم"
        />
        <input
          className={`${mField} mark`}
          dir="ltr"
          value={draft.whatsapp_number ?? ""}
          onChange={(e) => set({ whatsapp_number: e.target.value || null })}
          placeholder="واتساب"
        />

        <ImageField
          label="الشعار"
          folder="matam/brand"
          value={draft.logo_url}
          onChange={(url) => set({ logo_url: url })}
        />
        <ImageField
          label="صورة الغلاف"
          folder="matam/brand"
          value={draft.cover_url}
          onChange={(url) => set({ cover_url: url })}
        />

        {/* موقع المطعم: منه تبدأ خريطة العميل حين لا عنوان محفوظ له */}
        <MapPicker
          value={
            draft.restaurant_lat != null && draft.restaurant_lng != null
              ? { lat: draft.restaurant_lat, lng: draft.restaurant_lng }
              : null
          }
          onChange={(pt) => set({ restaurant_lat: pt.lat, restaurant_lng: pt.lng })}
        />
        <p className="text-[11px] text-m-faint">
          {draft.restaurant_lat != null
            ? "موقع المطعم محدَّد — تبدأ خريطة العميل منه"
            : "حدّد موقع المطعم على الخريطة"}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-m-dim">التشغيل</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["is_open", "مفتوح"],
              ["allow_orders", "يستقبل طلبات"],
              ["delivery_enabled", "التوصيل"],
            ] as const
          ).map(([key, label]) => {
            const on = Boolean(draft[key]);
            return (
              <button
                key={key}
                onClick={() => set({ [key]: !on } as Partial<S>)}
                className={`${mGhost} py-2 text-xs ${on ? "border-m-ok text-m-ok" : "text-m-faint"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">رسوم التوصيل</span>
            <input
              className={`${mField} mark`}
              inputMode="decimal"
              value={String(draft.delivery_fee)}
              onChange={(e) => set({ delivery_fee: num(e.target.value) })}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">أقل طلب</span>
            <input
              className={`${mField} mark`}
              inputMode="decimal"
              value={String(draft.min_order_amount)}
              onChange={(e) => set({ min_order_amount: num(e.target.value) })}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">التحضير (د)</span>
            <input
              className={`${mField} mark`}
              inputMode="numeric"
              value={String(draft.estimated_prep_time)}
              onChange={(e) => set({ estimated_prep_time: num(e.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-m-dim">ساعات العمل</h2>
        {hours.map((h) => (
          <div key={h.day} className="flex items-center gap-2 rounded-xl bg-m-surface p-2.5">
            <span className="w-16 shrink-0 text-xs">{DAY_NAMES[h.day]}</span>
            {h.closed ? (
              <span className="flex-1 text-xs text-m-faint">مغلق</span>
            ) : (
              <>
                <input
                  type="time"
                  className={`${mField} mark py-1.5 text-xs`}
                  value={h.shifts[0]?.open ?? "12:00"}
                  onChange={(e) =>
                    setDay(h.day, {
                      shifts: [{ open: e.target.value, close: h.shifts[0]?.close ?? "23:59" }],
                    })
                  }
                />
                <input
                  type="time"
                  className={`${mField} mark py-1.5 text-xs`}
                  value={h.shifts[0]?.close ?? "23:59"}
                  onChange={(e) =>
                    setDay(h.day, {
                      shifts: [{ open: h.shifts[0]?.open ?? "12:00", close: e.target.value }],
                    })
                  }
                />
              </>
            )}
            <button
              onClick={() => setDay(h.day, { closed: !h.closed })}
              className="shrink-0 text-[11px] text-m-accent"
            >
              {h.closed ? "افتح" : "أغلق"}
            </button>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-2">
        {saveState.error && (
          <p className="rounded-lg bg-m-danger/15 px-3 py-2 text-xs text-m-danger">
            {saveState.error}
          </p>
        )}
        <button onClick={() => void save()} disabled={saveState.busy} className={mPrimary}>
          {saveState.busy ? "جارٍ الحفظ…" : saveState.saved ? "حُفظ ✓" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
