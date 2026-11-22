"use client";

import type { Category, Task } from "../types";
import { fmtHM } from "../time";
import { Empty, Legend, Stack } from "./primitives";

const PARTS: { key: Category; label: string; color: string }[] = [
  { key: "work", label: "عمل", color: "var(--n-accent)" },
  { key: "rest", label: "راحة", color: "var(--n-ok)" },
  { key: "waste", label: "هدر", color: "#e08a7a" },
];

/** عمل أم راحة أم هدر؟ */
export function CategoryMix({
  tasks,
  days,
  now,
}: {
  tasks: Task[];
  days: string[];
  now: number;
}) {
  const inRange = new Set(days);
  const sums: Record<Category, number> = { work: 0, rest: 0, waste: 0 };

  for (const t of tasks) {
    const cat: Category =
      t.category === "rest" || t.category === "waste" ? t.category : "work";
    for (const seg of t.segments) {
      if (!inRange.has(seg.day)) continue;
      const end = seg.end ? +new Date(seg.end) : now;
      sums[cat] += end - +new Date(seg.start);
    }
  }

  const total = sums.work + sums.rest + sums.waste;
  if (!total) return <Empty />;

  return (
    <div className="flex flex-col gap-3">
      <Stack
        parts={PARTS.map((p) => ({
          key: p.key,
          value: sums[p.key],
          color: p.color,
          label: `${p.label}: ${fmtHM(sums[p.key])}`,
        }))}
      />
      <Legend
        items={PARTS.map((p) => ({
          key: p.key,
          color: p.color,
          label: p.label,
          value: `${Math.round((sums[p.key] / total) * 100)}%`,
          count: fmtHM(sums[p.key]),
        }))}
      />
    </div>
  );
}
