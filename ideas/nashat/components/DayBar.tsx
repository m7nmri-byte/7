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
  const arrow = "rounded-xl px-3 py-2 text-lg text-n-dim transition-colors hover:bg-n-surface hover:text-n-text disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className={arrow} aria-label="اليوم السابق">
          ›
        </button>
        <button
          onClick={onToday}
          className="rounded-xl px-4 py-2 text-base font-medium transition-colors hover:bg-n-surface"
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
        className="rounded-lg px-2.5 py-2 text-n-dim transition-colors hover:bg-n-surface hover:text-n-text"
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
    <div className="grid grid-cols-3 gap-3 rounded-3xl border border-n-line bg-n-surface p-5 sm:p-6">
      <div className="flex flex-col items-center gap-1">
        <span className="mark text-2xl tabular-nums sm:text-3xl">{fmtHM(stats.totalMs)}</span>
        <span className="text-xs text-n-faint">إجمالي الوقت</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-2 text-2xl sm:text-3xl">
          <StatusGlyph status="done" size={20} />
          <span className="mark tabular-nums">{stats.completed}</span>
        </span>
        <span className="text-xs text-n-faint">أُنجزت</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-2 text-2xl sm:text-3xl">
          <StatusGlyph status="interrupted" size={20} />
          <span className="mark tabular-nums">{stats.interruptedEvents}</span>
        </span>
        <span className="text-xs text-n-faint">مقاطعات</span>
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
    <div className="flex gap-1 rounded-xl border border-n-line p-1">
      {(
        [
          ["log", "اليوم"],
          ["stats", "الإحصاءات"],
        ] as const
      ).map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm transition-colors ${
            view === k ? "bg-n-accent-soft font-medium text-n-accent" : "text-n-dim hover:text-n-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
