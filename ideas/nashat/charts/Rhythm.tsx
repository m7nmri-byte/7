"use client";
import { F_SWITCH, arCount } from "../arabic";

import { FOCUS_MID } from "../types";
import type { DaySeg } from "../model";
import { unionMs } from "../model";
import { minsLabel, todayStr } from "../time";
import { StatRow, type Stat } from "./primitives";

const segMin = (s: DaySeg) => (s.b - s.a) / 60000;

/** سطر الإيقاع فوق شريط اليوم */
export function Rhythm({ day, segs }: { day: string; segs: DaySeg[] }) {
  if (!segs.length) return null;

  const today = day === todayStr();
  const sum = segs.reduce((a, s) => a + segMin(s), 0);
  const union = unionMs(segs) / 60000;
  const overlap = sum - union;
  const longest = segs.reduce((m, s) => (segMin(s) > segMin(m) ? s : m), segs[0]);
  const live = longest.status === "ongoing";
  const caption = `«${longest.task.name}»${live ? " — مستمرة الآن" : ""}`;

  if (segs.length === 1) {
    return (
      <StatRow
        items={[
          {
            n: minsLabel(segMin(longest)),
            l: live ? (today ? "مستمرة حتى الآن" : "المدة") : "جلسة واحدة",
          },
        ]}
        caption={caption}
      />
    );
  }

  const switches = segs.length - 1;
  let pace: string | null = null;
  if (union >= 60) {
    const perHour = switches / (union / 60);
    if (perHour >= 3) pace = "سريع";
    else if (perHour <= 1) pace = "هادئ";
  }

  /**
   * «تنقّلات» نصًّا ثابتًا تقول «١ تنقّلات» و«٠ تنقّلات».
   * وجدول الصيغ موجود لهذا، فيُستعمل.
   */
  const stats: Stat[] = [{ n: arCount(switches, F_SWITCH), l: "التنقّل", word: true }];
  if (pace) stats.push({ n: pace, l: "الإيقاع", word: true });
  if (overlap >= 5) stats.push({ n: minsLabel(overlap), l: "بالتوازي" });
  stats.push({
    n: minsLabel(segMin(longest)),
    l: segMin(longest) >= FOCUS_MID ? "أطول تركيز" : "أطول جلسة",
  });

  return <StatRow items={stats} caption={caption} />;
}
