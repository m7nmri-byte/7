"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type Task } from "../types";
import { lastSegment, taskTotalMs } from "../model";
import { fmtDur, fmtPeriod, fmtTime } from "../time";
import { field } from "@/components/styles";
import { useNow } from "./ui";

/* ---------- منتقي الفئة ---------- */

export function CategoryPicker({
  value,
  onChange,
}: {
  value: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          aria-pressed={value === c.key}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            value === c.key
              ? "bg-n-accent-soft font-medium text-n-accent"
              : "border border-n-line text-n-dim hover:text-n-text"
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
    <label className="flex items-center gap-2 text-sm text-n-dim">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        className="w-14 rounded-lg border border-n-line bg-n-bg px-2 py-1.5 text-center text-sm text-n-text outline-none focus:border-n-accent/60"
      />
      دقيقة
    </label>
  );
}

/* ---------- بطاقة المهمة الجارية ---------- */

const action =
  "rounded-xl px-5 py-3 text-sm font-medium transition-colors";

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

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-n-accent/25 bg-n-surface p-6 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          onClick={onEdit}
          className="max-w-full truncate text-xl font-medium transition-colors hover:text-n-accent sm:text-2xl"
        >
          {task.name}
        </button>

        <button
          onClick={onFullscreen}
          title="ملء الشاشة"
          className="mark text-5xl font-light tabular-nums text-n-accent transition-opacity hover:opacity-80 sm:text-7xl"
        >
          {fmtDur(elapsed)}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-n-faint">
          <span>
            بدأت {fmtTime(seg.start)} {fmtPeriod(seg.start)}
          </span>
          {resumed && (
            <span className="rounded-full bg-n-accent-soft px-2.5 py-0.5 text-n-accent">
              جلسة {task.segments.length} · المجموع {fmtDur(total)}
            </span>
          )}
        </div>
      </div>

      {task.steps.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-s-2 border-n-line ps-4 text-sm text-n-dim">
          {task.steps.map((s, i) => (
            <li key={i}>{s.text}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
        <button
          onClick={onFinish}
          className={`${action} bg-[var(--n-ok)] text-[#15251b] hover:brightness-110`}
        >
          أنهيتها
        </button>
        <button
          onClick={onInterrupt}
          className={`${action} bg-[var(--n-warn)] text-[#2a2115] hover:brightness-110`}
        >
          علّقها
        </button>
        <button onClick={onStep} className={`${action} border border-n-line text-n-text hover:bg-n-bg`}>
          + خطوة
        </button>
        {canAddParallel && (
          <button
            onClick={onParallel}
            className={`${action} border border-n-line text-n-dim hover:bg-n-bg hover:text-n-text`}
          >
            بالتوازي
          </button>
        )}
      </div>
    </section>
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
    <section className="flex flex-col gap-5 rounded-3xl border border-dashed border-n-line bg-n-surface p-6 sm:p-8">
      <p className="text-center text-base text-n-dim">ما الذي تعمل عليه الآن؟</p>

      <input
        className={`${field} py-3.5 text-center text-base`}
        placeholder="اسم المهمة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />

      <div className="flex justify-center">
        <CategoryPicker value={cat} onChange={setCat} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackMinutes value={back} onChange={setBack} />
        <button
          onClick={go}
          disabled={!name.trim()}
          className="rounded-xl bg-n-accent px-7 py-3 text-sm font-medium text-[#15202b] transition-colors hover:brightness-110 disabled:opacity-40"
        >
          ابدأ
        </button>
      </div>
    </section>
  );
}
