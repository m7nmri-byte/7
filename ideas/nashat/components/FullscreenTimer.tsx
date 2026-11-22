"use client";

import { useEffect, useState } from "react";
import type { Task } from "../types";
import { lastSegment } from "../model";
import { fmtDurLong, fmtPeriod, fmtTime } from "../time";

/** مؤقّت يملأ الشاشة — للنظر إليه من بعيد أثناء العمل */
export function FullscreenTimer({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const [rotated, setRotated] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!task) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearInterval(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [task, onClose]);

  if (!task) return null;
  const seg = lastSegment(task);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-paper">
      <button
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute end-4 top-4 rounded-lg px-3 py-2 text-lg text-muted transition-colors hover:text-ink"
      >
        ✕
      </button>
      <button
        onClick={() => setRotated(!rotated)}
        aria-label="تدوير أفقي"
        className="absolute start-4 top-4 rounded-lg px-3 py-2 text-lg text-muted transition-colors hover:text-ink"
      >
        ⟳
      </button>

      <div
        className="flex flex-col items-center gap-5 transition-transform duration-300"
        style={rotated ? { transform: "rotate(90deg)" } : undefined}
      >
        <p className="max-w-xs truncate text-center text-sm text-muted">{task.name}</p>
        <p className="mark text-5xl font-light tabular-nums text-brand sm:text-8xl">
          {fmtDurLong(tick - +new Date(seg.start))}
        </p>
        <p className="text-xs text-faint">
          بدأت {fmtTime(seg.start)} {fmtPeriod(seg.start)}
        </p>
      </div>
    </div>
  );
}
