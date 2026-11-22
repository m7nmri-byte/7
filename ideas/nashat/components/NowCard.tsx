"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type Task } from "../types";
import { lastSegment, taskTotalMs } from "../model";
import { fmtDur, fmtPeriod, fmtTime } from "../time";
import { btnGhost, btnPrimary, field, useNow } from "./ui";

/* ---------- منتقي الفئة ---------- */

export function CategoryPicker({
  value,
  onChange,
}: {
  value: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          aria-pressed={value === c.key}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            value === c.key
              ? "bg-brand-soft font-medium text-brand"
              : "border border-edge text-muted hover:text-ink"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- حقل «منذ كذا دقيقة» ---------- */

export function BackMinutes({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
      منذ
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
        className="w-12 rounded-md border border-edge bg-paper px-1.5 py-1 text-center text-xs text-ink outline-none focus:border-brand/60"
      />
      دقيقة
    </label>
  );
}

/* ---------- بطاقة المهمة الجارية ---------- */

export function NowCard({
  task,
  canAddParallel,
  onStep,
  onFinish,
  onInterrupt,
  onParallel,
  onFullscreen,
  onEdit,
}: {
  task: Task;
  canAddParallel: boolean;
  onStep: () => void;
  onFinish: () => void;
  onInterrupt: () => void;
  onParallel: () => void;
  onFullscreen: () => void;
  onEdit: () => void;
}) {
  const now = useNow();
  const seg = lastSegment(task);
  const elapsed = now - +new Date(seg.start);
  const total = taskTotalMs(task, now);
  const resumed = task.segments.length > 1;
  const todaySteps = task.steps;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <button
            onClick={onEdit}
            className="truncate text-start text-base font-semibold transition-colors hover:text-brand"
          >
            {task.name}
          </button>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
            <span>
              بدأت {fmtTime(seg.start)} {fmtPeriod(seg.start)}
            </span>
            {resumed && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">
                جلسة {task.segments.length} — المجموع {fmtDur(total)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onFullscreen}
          title="ملء الشاشة"
          className="mark shrink-0 rounded-lg px-2 py-1 text-xl tabular-nums text-brand transition-colors hover:bg-brand-soft"
        >
          {fmtDur(elapsed)}
        </button>
      </div>

      {todaySteps.length > 0 && (
        <ul className="flex flex-col gap-1 border-s-2 border-edge ps-3 text-xs text-muted">
          {todaySteps.map((s, i) => (
            <li key={i}>• {s.text}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={onFinish} className={btnPrimary}>
          ✓ أنهيتها
        </button>
        <button onClick={onInterrupt} className={btnGhost}>
          ⤴ علّقها
        </button>
        <button onClick={onStep} className={btnGhost}>
          + خطوة
        </button>
        {canAddParallel && (
          <button onClick={onParallel} className={`${btnGhost} text-muted`}>
            ⇄ بالتوازي
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- لا توجد مهمة جارية ---------- */

export function EmptyNow({
  onStart,
}: {
  onStart: (name: string, backMinutes: number, category: Category) => void;
}) {
  const [name, setName] = useState("");
  const [back, setBack] = useState(0);
  const [cat, setCat] = useState<Category>("work");

  const go = () => {
    if (!name.trim()) return;
    onStart(name, back, cat);
    setName("");
    setBack(0);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-edge bg-card p-5">
      <p className="text-sm text-muted">ما الذي تعمل عليه الآن؟</p>
      <input
        className={field}
        placeholder="اسم المهمة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <CategoryPicker value={cat} onChange={setCat} />
      <div className="flex items-center justify-between gap-3">
        <BackMinutes value={back} onChange={setBack} />
        <button onClick={go} disabled={!name.trim()} className={btnPrimary}>
          ابدأ
        </button>
      </div>
    </div>
  );
}
