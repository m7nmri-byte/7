import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export type Idea = {
  /** المعرّف في الرابط: ‎/lab/<slug> */
  slug: string;
  title: string;
  /** سطر واحد يظهر في الفهرس */
  summary: string;
  tags: string[];
  /** متى بدأت — بصيغة YYYY-MM */
  started: string;
  /** يُملأ حين تنتقل الفكرة إلى مشروع مستقل */
  movedUrl?: string;
};

/* ────────────────────────────────────────────────────────────
   لإضافة أداة:
     ١. أنشئ  ideas/<slug>/view.tsx  يُصدّر مكوّناً افتراضياً
     ٢. أضف سطراً في ideas أدناه
     ٣. أضف سطراً في views أدناه
   لنزعها: احذف الثلاثة.
   ──────────────────────────────────────────────────────────── */

export const ideas: Idea[] = [
  {
    slug: "nashat",
    title: "نشاط",
    summary: "سجلّ العمل اليومي: جلسات ومقاطعات وإحصاءات تركيز.",
    tags: ["إنتاجية", "وقت"],
    started: "2026-09",
  },
];

export const views: Record<string, ComponentType> = {
  nashat: dynamic(() => import("./nashat/view")),
};

export function getIdea(slug: string): Idea | undefined {
  return ideas.find((i) => i.slug === slug);
}
