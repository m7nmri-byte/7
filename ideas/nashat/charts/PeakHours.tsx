"use client";

import type { Task } from "../types";
import { daySegs } from "../model";
import { AR_WEEKDAYS, dayBounds, fmt12 } from "../time";
import { Empty, Take } from "./primitives";

const WEEK_ORDER = ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

/** متى تركّز أفضل؟ — تجميع دقائق التركيز بحسب اليوم والساعة */
export function PeakHours({
  tasks,
  days,
  highlight,
}: {
  tasks: Task[];
  days: string[];
  highlight?: string;
}) {
  const byWd: Record<string, number[]> = {};

  for (const d of days) {
    const segs = daySegs(tasks, d).filter((s) => (s.b - s.a) / 60000 >= 15);
    if (!segs.length) continue;
    const [d0] = dayBounds(d);
    const wd = AR_WEEKDAYS[new Date(`${d}T12:00:00`).getDay()];
    byWd[wd] ??= new Array(24).fill(0);

    // الاتحاد يمنع احتساب الوقت المتوازي مرتين
    const merged: { a: number; b: number }[] = [];
    for (const s of segs) {
      const last = merged[merged.length - 1];
      if (last && s.a <= last.b) last.b = Math.max(last.b, s.b);
      else merged.push({ a: s.a, b: s.b });
    }
    for (const { a, b } of merged) {
      for (let h = 0; h < 24; h++) {
        const x = d0 + h * 3_600_000;
        byWd[wd][h] += Math.max(0, Math.min(b, x + 3_600_000) - Math.max(a, x)) / 60000;
      }
    }
  }

  const rows = WEEK_ORDER.filter((wd) => byWd[wd]).map((wd) => ({ wd, hrs: byWd[wd] }));
  const colSum = new Array(24).fill(0) as number[];
  rows.forEach((r) => r.hrs.forEach((m, h) => (colSum[h] += m)));
  const used = colSum.map((m, h) => (m > 0 ? h : -1)).filter((h) => h >= 0);

  if (!used.length) return <Empty msg="لا توجد جلسات تركيز (١٥د فأكثر) بعد" />;

  const totalFocus = colSum.reduce((a, x) => a + x, 0);

  let best = used[0];
  let bestV = -1;
  for (let h = 0; h < 23; h++) {
    const v = colSum[h] + colSum[h + 1];
    if (v > bestV) {
      bestV = v;
      best = h;
    }
  }
  const span = Math.max(2, used[used.length - 1] - used[0] + 1);
  const avgWindow = (totalFocus / span) * 2;

  let wa = best;
  let wb = best + 2;
  if (colSum[wa] === 0) wa++;
  if (colSum[wb - 1] === 0) wb--;
  const range = wb - wa <= 1 ? `حوالي الساعة ${fmt12(wa)}` : `بين ${fmt12(wa)} و${fmt12(wb)}`;

  let msg = "";
  if (totalFocus < 45) msg = "";
  else if (rows.length === 1) msg = `تركيزك الأكبر كان ${range}`;
  else if (used.length <= 2) msg = `تركيزك محصور ${range} تقريبًا`;
  else if (bestV < avgWindow * 1.3)
    msg = `تركيزك موزّع بدون ذروة واضحة — أفضل وقت بفارق بسيط ${range}`;
  else
    msg =
      `ذروة تركيزك غالبًا ${range}` +
      (rows.length >= 3
        ? " — احجز هذا الوقت للمهام الثقيلة وأجّل المتابعات لغيره"
        : " — راقبها مع الأيام لتتأكد");

  let h0 = used[0];
  let h1 = used[used.length - 1] + 1;
  if (h1 - h0 < 8) {
    h1 = Math.min(24, h0 + 8);
    h0 = Math.max(0, h1 - 8);
  }

  const W = 340;
  const lblW = 52;
  const top = 4;
  const gap = 2;
  const n = h1 - h0;
  const cw = (W - lblW) / n;
  const ch = 16;
  const H = top + rows.length * (ch + gap) + 16;
  const step = n <= 10 ? 1 : 2;
  const hourTicks: number[] = [];
  for (let h = h0; h < h1; h += step) hourTicks.push(h);

  return (
    <div className="flex flex-col gap-3">
      <Take>{msg}</Take>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-hidden">
        {rows.map((r, ri) => {
          const y = top + ri * (ch + gap);
          const isSel = highlight === r.wd;
          const cells: number[] = [];
          for (let h = h0; h < h1; h++) cells.push(h);
          return (
            <g key={r.wd}>
              <text
                x={W - lblW / 2}
                y={y + ch / 2 + 3.5}
                textAnchor="middle"
                fontSize="9"
                fill={isSel ? "var(--ink)" : "var(--faint)"}
              >
                {r.wd}
              </text>
              {cells.map((h) => {
                const m = r.hrs[h];
                const x = W - lblW - (h - h0 + 1) * cw;
                return (
                  <rect
                    key={h}
                    x={x + gap / 2}
                    y={y}
                    width={cw - gap}
                    height={ch}
                    rx={3}
                    fill={m > 0 ? "var(--brand)" : "var(--paper)"}
                    fillOpacity={m > 0 ? 0.18 + 0.82 * Math.min(1, m / 60) : 1}
                  >
                    <title>{`${r.wd} ${fmt12(h)} — ${Math.round(m)} دقيقة تركيز`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
        {hourTicks.map((h) => (
          <text
            key={h}
            x={W - lblW - (h - h0 + 0.5) * cw}
            y={H - 3}
            textAnchor="middle"
            fontSize="9"
            fill="var(--faint)"
          >
            {h % 12 || 12}
          </text>
        ))}
      </svg>
      <p className="text-[11px] text-faint">كلما اشتدّ اللون زادت دقائق التركيز في تلك الساعة</p>
    </div>
  );
}
