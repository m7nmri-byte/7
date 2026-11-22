"use client";

import type { DaySeg } from "../model";
import { dayBounds, minsLabel, todayStr } from "../time";
import { Empty } from "./primitives";

const COLOR = {
  done: "var(--st-ripe)",
  interrupted: "var(--st-building)",
  ongoing: "var(--brand)",
} as const;

/** نافذة الساعات المعروضة — ستّ ساعات على الأقل، وتبدأ على رأس ساعة */
export function hourWindow(segs: DaySeg[], day: string): [number, number] {
  const [d0] = dayBounds(day);
  let h0 = Math.floor((segs[0].a - d0) / 3_600_000);
  let h1 = Math.ceil((Math.max(...segs.map((s) => s.b)) - d0) / 3_600_000);
  if (h1 - h0 < 6) {
    const extra = 6 - (h1 - h0);
    h0 = Math.max(0, h0 - Math.floor(extra / 2));
    h1 = Math.min(24, h0 + 6);
    h0 = Math.max(0, h1 - 6);
  }
  return [h0, h1];
}

/** شريط اليوم: كل مسار صفّ، فيظهر المتوازي جنباً إلى جنب */
export function Gantt({
  day,
  segs,
  now,
}: {
  day: string;
  segs: DaySeg[];
  now: number;
}) {
  if (!segs.length) return <Empty />;

  const [d0] = dayBounds(day);
  const [h0, h1] = hourWindow(segs, day);
  const W = 340;
  const padX = 10;
  const laneH = 16;
  const laneGap = 6;

  const lanesEnd: number[] = [];
  const placed = segs.map((s) => {
    let lane = lanesEnd.findIndex((e) => e <= s.a);
    if (lane === -1) {
      lane = lanesEnd.length;
      lanesEnd.push(0);
    }
    lanesEnd[lane] = s.b;
    return { ...s, lane };
  });

  const top = 6;
  const H = top + lanesEnd.length * (laneH + laneGap) + 22;
  const span = (h1 - h0) * 3_600_000;
  // من اليمين لليسار: الأقدم على اليمين
  const X = (t: number) => W - padX - ((t - d0 - h0 * 3_600_000) / span) * (W - 2 * padX);
  const step = h1 - h0 <= 8 ? 1 : h1 - h0 <= 14 ? 2 : 3;

  const ticks: number[] = [];
  for (let h = h0; h <= h1; h += step) ticks.push(h);

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {ticks.map((h) => {
          const x = X(d0 + h * 3_600_000);
          return (
            <g key={h}>
              <line
                x1={x}
                x2={x}
                y1={top - 2}
                y2={H - 18}
                stroke="var(--edge)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={H - 5}
                textAnchor="middle"
                fontSize="9"
                fill="var(--faint)"
                className="mark"
              >
                {h % 24}
              </text>
            </g>
          );
        })}

        {placed.map((s, i) => {
          const x1 = X(s.b);
          const w = Math.max(2, X(s.a) - x1);
          return (
            <rect
              key={i}
              x={x1}
              y={top + s.lane * (laneH + laneGap)}
              width={w}
              height={laneH}
              rx={4}
              fill={COLOR[s.status]}
              opacity={s.status === "ongoing" ? 1 : 0.8}
            >
              <title>{`${s.task.name} — ${minsLabel((s.b - s.a) / 60000)}`}</title>
            </rect>
          );
        })}

        {day === todayStr() && (
          <line
            x1={X(now)}
            x2={X(now)}
            y1={top - 4}
            y2={H - 18}
            stroke="var(--brand)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-faint">
        {(
          [
            ["done", "أُنجزت"],
            ["interrupted", "قوطعت"],
            ["ongoing", "جارية"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <i className="size-2 rounded-full" style={{ backgroundColor: COLOR[k] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
