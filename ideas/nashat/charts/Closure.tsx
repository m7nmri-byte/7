"use client";

import type { Task } from "../types";
import { dayStats } from "../model";
import { AR_WEEKDAYS, addDays, todayStr } from "../time";
import { Empty, Take } from "./primitives";

/** أغلقت أم تركت؟ — مقارنة الإنجاز بالمقاطعة عبر سبعة أيام */
export function Closure({ tasks, day }: { tasks: Task[]; day: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(day, -(6 - i)));
  const data = days.map((d) => {
    const st = dayStats(tasks, d);
    return {
      d,
      done: st.completed,
      intr: st.interruptedEvents,
      wd: AR_WEEKDAYS[new Date(`${d}T12:00:00`).getDay()],
    };
  });

  const totD = data.reduce((a, x) => a + x.done, 0);
  const totI = data.reduce((a, x) => a + x.intr, 0);
  const total = totD + totI;
  if (!total) return <Empty msg="لا نشاط في آخر ٧ أيام" />;

  const activeDays = data.filter((x) => x.done + x.intr > 0).length;
  const rate = Math.round((totD / total) * 100);
  const sel = data[data.length - 1];

  let msg = "";
  if (total < 3) msg = "";
  else if (totI === 0) msg = "كل جلساتك في هذه الفترة انتهت بإنجاز — بدون مقاطعة واحدة";
  else if (totD === 0)
    msg =
      "كل الجلسات انتهت بمقاطعة — يحدث في أيام الطوارئ؛ جرّب إغلاق مهمة صغيرة واحدة يوميًا";
  else if (rate >= 70) msg = `${rate}% من جلساتك انتهت بإنجاز — نسبة إغلاق عالية`;
  else if (rate >= 45) msg = `${rate}% من جلساتك انتهت بإنجاز، والباقي قُطع في منتصفه`;
  else
    msg = `المقاطعات تغلب — ${rate}% فقط من جلساتك انتهت بإنجاز؛ حماية ساعة ثابتة يوميًا قد تصنع فرقًا`;

  let compare: string | null = null;
  const selT = sel.done + sel.intr;
  const restT = total - selT;
  if (selT >= 3 && restT >= 3 && activeDays >= 3) {
    const selR = sel.done / selT;
    const restR = (totD - sel.done) / restT;
    const label = day === todayStr() ? "اليوم" : "هذا اليوم";
    if (selR - restR >= 0.15) compare = `${label} أفضل من معدّلك في الأيام السابقة`;
    else if (restR - selR >= 0.15)
      compare = `${label} أكثر تقطّعًا من معدّلك — لا بأس، بعض الأيام هكذا`;
  }

  const W = 340;
  const H = 150;
  const padX = 8;
  const mid = 74;
  const amp = 54;
  const maxV = Math.max(1, ...data.map((x) => Math.max(x.done, x.intr)));
  const slot = (W - 2 * padX) / 7;
  const bw = Math.min(22, slot * 0.5);

  return (
    <div className="flex flex-col gap-3">
      <Take>
        {msg}
        {activeDays === 1 && total >= 3 && <span className="text-n-faint"> (من يوم واحد فقط)</span>}
        {compare && (
          <>
            <br />
            {compare}
          </>
        )}
      </Take>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={padX} x2={W - padX} y1={mid} y2={mid} stroke="var(--n-line)" />
        {data.map((x, i) => {
          const cx = W - padX - slot * (i + 0.5);
          const isSel = x.d === day;
          const hu = (x.done / maxV) * amp;
          const hd = (x.intr / maxV) * amp;
          return (
            <g key={x.d}>
              {x.done > 0 && (
                <>
                  <rect
                    x={cx - bw / 2}
                    y={mid - hu}
                    width={bw}
                    height={hu}
                    rx={3}
                    fill="var(--n-ok)"
                    opacity={isSel ? 1 : 0.55}
                  >
                    <title>{`${x.wd}: ${x.done} منجزة`}</title>
                  </rect>
                  <text x={cx} y={mid - hu - 4} textAnchor="middle" fontSize="9" fill="var(--n-dim)">
                    {x.done}
                  </text>
                </>
              )}
              {x.intr > 0 && (
                <>
                  <rect
                    x={cx - bw / 2}
                    y={mid + 1}
                    width={bw}
                    height={hd}
                    rx={3}
                    fill="#e08a7a"
                    opacity={isSel ? 1 : 0.55}
                  >
                    <title>{`${x.wd}: ${x.intr} مقاطعة`}</title>
                  </rect>
                  <text x={cx} y={mid + hd + 11} textAnchor="middle" fontSize="9" fill="var(--n-dim)">
                    {x.intr}
                  </text>
                </>
              )}
              <text
                x={cx}
                y={H - 2}
                textAnchor="middle"
                fontSize="9"
                fill={isSel ? "var(--n-text)" : "var(--n-faint)"}
              >
                {x.wd}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex gap-4 text-[11px] text-n-faint">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full" style={{ background: "var(--n-ok)" }} />
          أُنجزت (فوق)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full" style={{ background: "#e08a7a" }} />
          قوطعت (تحت)
        </span>
      </div>
    </div>
  );
}
