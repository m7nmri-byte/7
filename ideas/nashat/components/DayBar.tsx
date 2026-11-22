"use client";

import type { DayStats } from "../model";
import { fmtHM, shortDayLabel } from "../time";
import { StatusGlyph } from "./Timeline";

/** شريط التنقّل بين الأيام */
export function DayNav({
  day,
  canNext,
  onPrev,
  onNext,
  onToday,
  onMenu,
}: {
  day: string;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onMenu: () => void;
}) {
  const arrow = "rounded-lg px-2.5 py-1.5 text-muted transition-colors hover:bg-card hover:text-ink disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className={arrow} aria-label="اليوم السابق">
          ›
        </button>
        <button
          onClick={onToday}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card"
        >
          {shortDayLabel(day)}
        </button>
        <button onClick={onNext} disabled={!canNext} className={arrow} aria-label="اليوم التالي">
          ‹
        </button>
      </div>

      <button
        onClick={onMenu}
        aria-label="خيارات"
        className="rounded-lg px-2.5 py-2 text-muted transition-colors hover:bg-card hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
    </div>
  );
}

/** ملخّص اليوم: الوقت والمنجَز والمقاطعات */
export function Summary({ stats }: { stats: DayStats }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-edge bg-card p-4">
      <div className="flex flex-col items-center gap-1">
        <span className="mark text-lg tabular-nums">{fmtHM(stats.totalMs)}</span>
        <span className="text-[11px] text-faint">إجمالي الوقت</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-1.5 text-lg">
          <StatusGlyph status="done" size={15} />
          <span className="mark tabular-nums">{stats.completed}</span>
        </span>
        <span className="text-[11px] text-faint">أُنجزت</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-1.5 text-lg">
          <StatusGlyph status="interrupted" size={15} />
          <span className="mark tabular-nums">{stats.interruptedEvents}</span>
        </span>
        <span className="text-[11px] text-faint">مقاطعات</span>
      </div>
    </div>
  );
}

/** تبويبا السجل والإحصاءات */
export function ViewTabs({
  view,
  onChange,
}: {
  view: "log" | "stats";
  onChange: (v: "log" | "stats") => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-edge p-1">
      {(
        [
          ["log", "اليوم"],
          ["stats", "الإحصاءات"],
        ] as const
      ).map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
            view === k ? "bg-brand-soft font-medium text-brand" : "text-muted hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
