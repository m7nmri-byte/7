"use client";

import type { Task } from "../types";
import { lastSegment, taskTotalMs } from "../model";
import { F_PENDING, ageText, arCount } from "../arabic";
import { minsLabel } from "../time";
import { Empty, Take } from "./primitives";

const ageLabel = (h: number) =>
  h < 1 ? `${Math.max(1, Math.round(h * 60))}د` : h < 24 ? `${Math.round(h)}س` : `${Math.round(h / 24)}ي`;

const ageColor = (h: number) =>
  h >= 72 ? "#e08a7a" : h >= 24 ? "#d0975c" : "var(--n-warn)";

/** الحلقات المفتوحة: ما يزال معلّقاً وينتظر */
export function OpenLoops({
  pending,
  now,
  onResume,
}: {
  pending: Task[];
  now: number;
  onResume: (id: string) => void;
}) {
  if (!pending.length) return <Empty msg="لا توجد حلقات مفتوحة" />;

  const items = pending
    .map((t) => ({
      t,
      age: (now - +new Date(lastSegment(t).end!)) / 3_600_000,
      invested: taskTotalMs(t, now) / 60000,
    }))
    .sort((a, b) => b.age - a.age);

  const n = items.length;
  const oldest = items[0];
  const old = items.filter((x) => x.age >= 24).length;
  const recent = items.filter((x) => x.age < 3).length;
  const nm = `«${oldest.t.name}»`;
  const inv = oldest.invested >= 30 ? ` وفيها ${minsLabel(oldest.invested)} من شغلك` : "";

  let msg: string;
  if (n === 1) {
    msg =
      oldest.age < 1
        ? `${nm} معلّقة منذ ${ageText(oldest.age)} فقط — الرجوع لها الآن أسهل ما يكون`
        : oldest.age < 24
          ? `${nm} معلّقة منذ ${ageText(oldest.age)}${inv}`
          : `${nm} تنتظرك منذ ${ageText(oldest.age)}${inv} — قرّر: تكملها أو تنهيها`;
  } else if (old === 0) {
    msg = `${arCount(n, F_PENDING)}، كلها من ${
      oldest.age < 3 ? "الساعات القليلة الماضية" : "اليوم"
    } — ما زالت طازجة في ذهنك`;
  } else {
    const part =
      old === n ? `${n === 2 ? "كلتاهما" : "كلها"} أقدم من يوم` : `منها ${old} أقدم من يوم`;
    msg = `${arCount(n, F_PENDING)}، ${part} — أقدمها ${nm} (${ageText(oldest.age)})`;
  }

  const extra =
    n >= 8
      ? "العدد كبير ويثقل الذهن — راجعها وأغلق ما لم يعد يلزم"
      : recent && old && n >= 3
        ? "ابدأ بالأحدث وهي حاضرة في ذهنك، ثم الأقدم"
        : null;

  const shown = items.slice(0, 6);
  const maxAge = Math.max(...shown.map((x) => x.age), 1);

  return (
    <div className="flex flex-col gap-3">
      <Take>
        {msg}
        {extra && (
          <>
            <br />
            {extra}
          </>
        )}
      </Take>

      <ul className="flex flex-col gap-1.5">
        {shown.map((x) => (
          <li key={x.t.id}>
            <button
              onClick={() => onResume(x.t.id)}
              title={`اضغط للاستكمال — معلّقة منذ ${ageText(x.age)}`}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-n-bg"
            >
              <span className="w-28 shrink-0 truncate text-xs">{x.t.name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-n-bg">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (x.age / maxAge) * 100)}%`,
                    backgroundColor: ageColor(x.age),
                  }}
                />
              </span>
              <span
                className="mark w-8 shrink-0 text-end text-[11px] tabular-nums"
                style={{ color: ageColor(x.age) }}
              >
                {ageLabel(x.age)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {n > shown.length && (
        <p className="text-[11px] text-n-faint">و{n - shown.length} أخرى أحدث</p>
      )}
      <p className="text-[11px] text-n-faint">
        طول الشريط = مدة الانتظار · اضغط على أي مهمة لاستكمالها
      </p>
    </div>
  );
}
