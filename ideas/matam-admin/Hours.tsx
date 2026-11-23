"use client";

import { useState } from "react";
import type { DayHours, Settings, Shift } from "../matam/types";
import { saveSettings } from "../matam/db";
import { useSaver } from "../matam/hooks";
import { DAY_NAMES } from "../matam/format";
import { mField, mGhost, mPrimary } from "../matam/ui";

const defaults = (): DayHours[] =>
  Array.from({ length: 7 }, (_, day) => ({
    day,
    closed: false,
    shifts: [{ open: "12:00", close: "23:59" }],
  }));

/**
 * ساعات العمل بفترات متعددة لليوم الواحد.
 * مطعم يفتح ظهرًا ويغلق عصرًا ثم يفتح مساءً لا تكفيه فترة واحدة،
 * وهذا شائع في السعودية.
 */
export function Hours({
  settings,
  onChanged,
}: {
  settings: Settings | null;
  onChanged: () => void;
}) {
  const [hours, setHours] = useState<DayHours[]>(
    settings?.work_hours?.length ? settings.work_hours : defaults(),
  );
  const saveState = useSaver();

  const patch = (day: number, p: Partial<DayHours>) => {
    setHours((h) => h.map((d) => (d.day === day ? { ...d, ...p } : d)));
    saveState.touch();
  };

  const setShift = (day: number, i: number, s: Partial<Shift>) =>
    patch(day, {
      shifts: hours
        .find((d) => d.day === day)!
        .shifts.map((sh, k) => (k === i ? { ...sh, ...s } : sh)),
    });

  const addShift = (day: number) =>
    patch(day, {
      shifts: [...hours.find((d) => d.day === day)!.shifts, { open: "16:00", close: "23:00" }],
    });

  const removeShift = (day: number, i: number) =>
    patch(day, {
      shifts: hours.find((d) => d.day === day)!.shifts.filter((_, k) => k !== i),
    });

  const copyToAll = (day: number) => {
    const src = hours.find((d) => d.day === day)!;
    setHours((h) => h.map((d) => ({ ...d, closed: src.closed, shifts: [...src.shifts] })));
    saveState.touch();
  };

  const save = () =>
    saveState.run(async () => {
      await saveSettings({ work_hours: hours });
      onChanged();
    });

  return (
    <div className="flex flex-col gap-3 p-4">
      {hours.map((d) => (
        <section key={d.day} className="flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{DAY_NAMES[d.day]}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => copyToAll(d.day)}
                className="text-[11px] text-m-faint hover:text-m-accent"
              >
                انسخ للكل
              </button>
              <button
                onClick={() => patch(d.day, { closed: !d.closed })}
                className={`text-[11px] font-medium ${d.closed ? "text-m-danger" : "text-m-ok"}`}
              >
                {d.closed ? "مغلق" : "مفتوح"}
              </button>
            </div>
          </div>

          {!d.closed && (
            <div className="flex flex-col gap-2">
              {d.shifts.map((sh, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    className={`${mField} mark py-1.5 text-xs`}
                    value={sh.open}
                    onChange={(e) => setShift(d.day, i, { open: e.target.value })}
                  />
                  <span className="text-xs text-m-faint">إلى</span>
                  <input
                    type="time"
                    className={`${mField} mark py-1.5 text-xs`}
                    value={sh.close}
                    onChange={(e) => setShift(d.day, i, { close: e.target.value })}
                  />
                  {d.shifts.length > 1 && (
                    <button
                      onClick={() => removeShift(d.day, i)}
                      aria-label="احذف الفترة"
                      className="shrink-0 px-1 text-m-faint hover:text-m-danger"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addShift(d.day)}
                className="self-start text-[11px] text-m-accent"
              >
                + فترة ثانية
              </button>
            </div>
          )}
        </section>
      ))}

      <div className="flex flex-col gap-2">
        {saveState.error && (
          <p className="rounded-lg bg-m-danger/15 px-3 py-2 text-xs text-m-danger">
            {saveState.error}
          </p>
        )}
        <button onClick={() => void save()} disabled={saveState.busy} className={mPrimary}>
          {saveState.busy ? "جارٍ الحفظ…" : saveState.saved ? "حُفظ ✓" : "حفظ ساعات العمل"}
        </button>
      </div>

      <button
        onClick={() => {
          setHours(defaults());
          saveState.touch();
        }}
        className={`${mGhost} text-xs`}
      >
        إعادة للافتراضي
      </button>
    </div>
  );
}
