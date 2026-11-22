"use client";

import type { Task } from "../types";
import { daySegs, pendingTasks, segmentStatus } from "../model";
import { AR_WEEKDAYS, addDays, allDaysOf, fmtHM } from "./deps";
import { Card, Empty, StatRow } from "./primitives";
import { CategoryMix } from "./CategoryMix";
import { Closure } from "./Closure";
import { FocusMix } from "./FocusMix";
import { Gantt } from "./Gantt";
import { OpenLoops } from "./OpenLoops";
import { PeakHours } from "./PeakHours";
import { Rhythm } from "./Rhythm";

export type Period = "day" | "week" | "month" | "year" | "all";

export const PERIOD_LABEL: Record<Exclude<Period, "day">, string> = {
  week: "آخر 7 أيام",
  month: "آخر 30 يومًا",
  year: "آخر سنة",
  all: "كل الوقت",
};

export function periodDays(period: Period, endDay: string, tasks: Task[]): string[] {
  const back = (n: number) =>
    Array.from({ length: n }, (_, i) => addDays(endDay, -(n - 1 - i)));
  if (period === "week") return back(7);
  if (period === "month") return back(30);
  if (period === "year") return back(365);
  if (period === "all") {
    const a = allDaysOf(tasks).filter((d) => d <= endDay);
    return a.length ? a : [endDay];
  }
  return [endDay];
}

/* ===================== عرض اليوم ===================== */

export function DayCharts({
  tasks,
  day,
  now,
  onResume,
}: {
  tasks: Task[];
  day: string;
  now: number;
  onResume: (id: string) => void;
}) {
  const segs = daySegs(tasks, day, now);
  const weekday = AR_WEEKDAYS[new Date(`${day}T12:00:00`).getDay()];

  return (
    <div className="flex flex-col gap-4">
      <Card title="إيقاع اليوم">
        <Rhythm day={day} segs={segs} />
        <Gantt day={day} segs={segs} now={now} />
      </Card>

      <Card title="عمل أم راحة أم هدر؟">
        <CategoryMix tasks={tasks} days={[day]} now={now} />
      </Card>

      <Card title="تركيز أم تشتّت؟">
        <FocusMix day={day} segs={segs} />
      </Card>

      <Card title="الحلقات المفتوحة">
        <OpenLoops pending={pendingTasks(tasks)} now={now} onResume={onResume} />
      </Card>

      <Card title="أغلقت أم تركت؟ — آخر ٧ أيام">
        <Closure tasks={tasks} day={day} />
      </Card>

      <Card title="متى تركّز أفضل؟">
        <PeakHours tasks={tasks} days={periodDays("week", day, tasks)} highlight={weekday} />
      </Card>
    </div>
  );
}

/* ===================== عرض المدى ===================== */

export function RangeCharts({
  tasks,
  days,
  period,
  now,
}: {
  tasks: Task[];
  days: string[];
  period: Exclude<Period, "day">;
  now: number;
}) {
  const inRange = new Set(days);
  const perDay = new Map<string, number>(days.map((d) => [d, 0]));
  const byTask = new Map<string, number>();

  let totalMs = 0;
  let completed = 0;
  let interrupted = 0;

  for (const t of tasks) {
    t.segments.forEach((seg, idx) => {
      if (!inRange.has(seg.day)) return;
      const ms = (seg.end ? +new Date(seg.end) : now) - +new Date(seg.start);
      totalMs += ms;
      perDay.set(seg.day, (perDay.get(seg.day) ?? 0) + ms);
      byTask.set(t.id, (byTask.get(t.id) ?? 0) + ms);
      const st = segmentStatus(t, idx);
      if (st === "done") completed++;
      if (st === "interrupted") interrupted++;
    });
  }

  if (totalMs === 0) {
    return (
      <Card title={PERIOD_LABEL[period]}>
        <Empty msg="لا توجد بيانات في هذه الفترة بعد" />
      </Card>
    );
  }

  const activeDays = [...perDay.values()].filter((v) => v > 0).length;
  const avgMs = activeDays ? totalMs / activeDays : 0;

  // الفترات الطويلة تُجمَّع أسبوعياً حتى تبقى الأعمدة مقروءة
  const bucketSize = days.length > 45 ? 7 : 1;
  const buckets: { label: string; ms: number }[] = [];
  for (let i = 0; i < days.length; i += bucketSize) {
    const slice = days.slice(i, i + bucketSize);
    buckets.push({
      label:
        bucketSize > 1
          ? ""
          : new Date(`${slice[0]}T12:00:00`).toLocaleDateString("ar-SA-u-ca-gregory", {
              day: "numeric",
              month: "numeric",
            }),
      ms: slice.reduce((a, d) => a + (perDay.get(d) ?? 0), 0),
    });
  }

  const W = 340;
  const H = 130;
  const padX = 8;
  const padB = 18;
  const padT = 6;
  const slot = (W - padX * 2) / buckets.length;
  const bw = Math.max(2, slot - 2);
  const maxMs = Math.max(...buckets.map((b) => b.ms), 1);

  const top5 = [...byTask.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, ms]) => ({ task: tasks.find((t) => t.id === id), ms }))
    .filter((x): x is { task: Task; ms: number } => Boolean(x.task));

  return (
    <div className="flex flex-col gap-4">
      <Card title={`ملخّص — ${PERIOD_LABEL[period]}`}>
        <StatRow
          items={[
            { n: fmtHM(totalMs), l: "إجمالي الوقت" },
            { n: completed, l: "أُنجزت" },
            { n: interrupted, l: "مقاطعات" },
            { n: fmtHM(avgMs), l: "متوسط اليوم" },
          ]}
        />
      </Card>

      <Card title={`الوقت اليومي${bucketSize > 1 ? " (مجمّع أسبوعيًا)" : ""}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-hidden">
          {buckets.map((b, i) => {
            const h = b.ms > 0 ? Math.max(3, (b.ms / maxMs) * (H - padT - padB)) : 0;
            return (
              <g key={i}>
                <rect
                  x={padX + i * slot}
                  y={H - padB - h}
                  width={bw}
                  height={h}
                  rx={2}
                  fill="var(--brand)"
                  fillOpacity={0.8}
                >
                  <title>{`${b.label} ${fmtHM(b.ms)}`}</title>
                </rect>
                {bucketSize === 1 && buckets.length <= 14 && (
                  <text
                    x={padX + i * slot + bw / 2}
                    y={H - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--faint)"
                  >
                    {b.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Card>

      <Card title="عمل أم راحة أم هدر؟">
        <CategoryMix tasks={tasks} days={days} now={now} />
      </Card>

      <Card title="متى تركّز أفضل؟">
        <PeakHours tasks={tasks} days={days} />
      </Card>

      {top5.length > 0 && (
        <Card title="الأكثر استهلاكًا للوقت">
          <ul className="flex flex-col gap-2">
            {top5.map((x) => (
              <li key={x.task.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-muted">{x.task.name}</span>
                <b className="mark shrink-0 font-medium tabular-nums">{fmtHM(x.ms)}</b>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
