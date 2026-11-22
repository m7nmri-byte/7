"use client";

import { FOCUS_DEEP, FOCUS_MID } from "../types";
import type { DaySeg } from "../model";
import { F_DEEP, F_SESSION, arCount } from "../arabic";
import { minsLabel, todayStr } from "../time";
import { Empty, Legend, Stack, Take } from "./primitives";

const segMin = (s: DaySeg) => (s.b - s.a) / 60000;

type Bucket = "deep" | "mid" | "frag" | "live";

/** تركيز أم تشتّت: توزيع الوقت على طول الجلسات */
export function FocusMix({ day, segs }: { day: string; segs: DaySeg[] }) {
  if (!segs.length) return <Empty />;

  const today = day === todayStr();
  const ms: Record<Bucket, number> = { deep: 0, mid: 0, frag: 0, live: 0 };
  const count: Record<Bucket, number> = { deep: 0, mid: 0, frag: 0, live: 0 };

  for (const s of segs) {
    const m = segMin(s);
    // الجلسة الجارية ليست «قصيرة» بعد — قد تصير عميقة
    const k: Bucket =
      m >= FOCUS_DEEP ? "deep" : s.status === "ongoing" ? "live" : m >= FOCUS_MID ? "mid" : "frag";
    ms[k] += m;
    count[k]++;
  }

  const closed = ms.deep + ms.mid + ms.frag;
  const total = closed + ms.live || 1;
  const deepP = closed ? Math.round((ms.deep / closed) * 100) : 0;
  const fragP = closed ? Math.round((ms.frag / closed) * 100) : 0;

  let msg = "";
  if (closed < 20) {
    msg = "";
  } else if (count.deep === 0) {
    msg =
      `لا توجد جلسة وصلت ${FOCUS_DEEP} دقيقة ${today ? "حتى الآن" : "في هذا اليوم"}` +
      (fragP >= 50 ? " — أغلب الوقت ذهب في متابعات قصيرة" : " — جرّب تمديد جلسة واحدة قليلًا");
  } else if (deepP >= 70) {
    const head = today && closed + ms.live < 90 ? "بداية مركّزة" : "يوم مركّز";
    msg = `${head} — ${deepP}% من وقتك في ${arCount(count.deep, F_DEEP)}`;
  } else if (deepP >= 40) {
    msg = `توازن جيد — ${deepP}% تركيز عميق، والباقي بين متابعات ومقاطعات`;
  } else if (fragP >= 50) {
    msg = `يوم متقطّع — ${fragP}% من وقتك في جلسات أقل من ${FOCUS_MID} دقائق، وهذا متوقّع في أيام المتابعة الكثيفة`;
  } else {
    msg = `أغلب وقتك في جلسات متوسطة — ${deepP}% فقط وصلت إلى تركيز عميق`;
  }

  const parts = (
    [
      { key: "deep", label: "تركيز عميق", sub: `${FOCUS_DEEP}د فأكثر`, color: "var(--st-building)" },
      { key: "mid", label: "متوسط", sub: `${FOCUS_MID}–${FOCUS_DEEP}د`, color: "var(--brand)" },
      { key: "frag", label: "متقطع", sub: `أقل من ${FOCUS_MID}د`, color: "#e08a7a" },
      { key: "live", label: "جارية", sub: "لم تُحسم بعد", color: "var(--edge)" },
    ] as const
  ).filter((p) => p.key !== "live" || count.live > 0);

  return (
    <div className="flex flex-col gap-3">
      <Take>{msg}</Take>
      <Stack
        parts={parts.map((p) => ({
          key: p.key,
          value: ms[p.key],
          color: p.color,
          label: `${p.label}: ${minsLabel(ms[p.key])}`,
        }))}
      />
      <Legend
        items={parts.map((p) => ({
          key: p.key,
          color: p.color,
          label: p.label,
          sub: p.sub,
          value: `${Math.round((ms[p.key] / total) * 100)}%`,
          count: arCount(count[p.key], F_SESSION) || "—",
        }))}
      />
    </div>
  );
}
