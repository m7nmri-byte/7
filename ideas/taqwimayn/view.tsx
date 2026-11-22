"use client";

import { useMemo, useState } from "react";
import { useToday } from "./useToday";
import {
  HIJRI_MONTHS,
  dayName,
  fromHijri,
  gregorianText,
  hijriMonthLength,
  hijriText,
  toHijri,
  type Ymd,
} from "./hijri";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs tracking-wide text-faint">{label}</span>
      {children}
    </label>
  );
}

const control =
  "bg-card border border-edge rounded-xl px-3 py-2.5 text-ink outline-none " +
  "transition-colors focus:border-brand/60 hover:border-edge";

export default function Taqwimayn() {
  const [mode, setMode] = useState<"g2h" | "h2g">("g2h");

  // اليوم الحالي: null أثناء التوليد، وقيمة حقيقية في المتصفح
  const today = useToday();

  // ما لم يغيّره المستخدم، تُعرض قيمة اليوم
  const [gEdit, setGEdit] = useState<string | null>(null);
  const [hEdit, setHEdit] = useState<Ymd | null>(null);

  const g = gEdit ?? today;
  const h = useMemo(
    () => hEdit ?? (today ? toHijri(new Date(`${today}T00:00:00Z`)) : null),
    [hEdit, today],
  );

  const result = useMemo(() => {
    if (mode === "g2h") {
      if (!g) return null;
      const date = new Date(`${g}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return null;
      return { date, hijri: toHijri(date) };
    }
    if (!h) return null;
    const date = fromHijri(h);
    return date ? { date, hijri: h } : null;
  }, [mode, g, h]);

  const maxDay = useMemo(() => (h ? hijriMonthLength(h.y, h.m) : 30), [h]);

  if (!g || !h) {
    return (
      <div
        aria-hidden
        className="h-72 animate-pulse rounded-xl border border-edge bg-card"
      />
    );
  }

  const setPart = (part: keyof Ymd, value: number) =>
    setHEdit({ ...h, [part]: value });

  return (
    <div className="flex flex-col gap-8">
      {/* مبدّل الاتجاه */}
      <div className="inline-flex self-start rounded-lg border border-edge bg-card p-1">
        {(
          [
            ["g2h", "ميلادي ← هجري"],
            ["h2g", "هجري ← ميلادي"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            aria-pressed={mode === key}
            className={`rounded-md px-4 py-2 text-sm transition-colors ${
              mode === key ? "bg-brand-soft text-brand font-medium" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* المدخلات */}
      {mode === "g2h" ? (
        <Field label="التاريخ الميلادي">
          <input
            type="date"
            value={g}
            onChange={(e) => setGEdit(e.target.value)}
            className={`${control} latin w-full max-w-xs`}
          />
        </Field>
      ) : (
        <div className="grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="اليوم">
            <input
              type="number"
              min={1}
              max={maxDay}
              value={h.d}
              onChange={(e) =>
                setPart("d", Math.min(maxDay, Math.max(1, Number(e.target.value) || 1)))
              }
              className={`${control} latin w-full`}
            />
          </Field>
          <Field label="الشهر">
            <select
              value={h.m}
              onChange={(e) => setPart("m", Number(e.target.value))}
              className={`${control} w-full`}
            >
              {HIJRI_MONTHS.map((name, i) => (
                <option key={name} value={i + 1} className="bg-card">
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="السنة">
            <input
              type="number"
              min={1}
              max={1600}
              value={h.y}
              onChange={(e) => setPart("y", Number(e.target.value) || 1)}
              className={`${control} latin w-full`}
            />
          </Field>
        </div>
      )}

      {/* النتيجة */}
      <div className="rounded-2xl border border-edge bg-card p-6 sm:p-8">
        {result ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-brand">{dayName(result.date)}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs tracking-wide text-faint">هجري</span>
                <span className="text-xl font-light sm:text-2xl">
                  {hijriText(result.hijri)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 sm:border-s sm:border-edge sm:ps-5">
                <span className="text-xs tracking-wide text-faint">ميلادي</span>
                <span className="text-xl font-light sm:text-2xl">
                  {gregorianText(result.date)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted">تاريخ غير موجود في التقويم.</p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-faint">
        يعتمد التحويل على تقويم أم القرى المدمج في المتصفح، وقد يفرق يوماً عن
        الرؤية الشرعية في بعض الأشهر.
      </p>
    </div>
  );
}
