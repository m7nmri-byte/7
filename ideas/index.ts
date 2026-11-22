import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** حالة الفكرة في دورة حياتها */
export type Status = "seed" | "building" | "ripe" | "freed";

export type Idea = {
  /** المعرّف في الرابط: ‎/lab/<slug> */
  slug: string;
  title: string;
  /** سطر واحد يظهر في الفهرس */
  summary: string;
  status: Status;
  tags: string[];
  /** متى بدأت — بصيغة YYYY-MM */
  started: string;
  /** يُملأ حين تُعزل الفكرة إلى مشروع مستقل */
  freedUrl?: string;
};

export const STATUS: Record<
  Status,
  { label: string; color: string; tint: string }
> = {
  seed: { label: "بذرة", color: "var(--st-seed)", tint: "var(--st-seed-tint)" },
  building: { label: "قيد العمل", color: "var(--st-building)", tint: "var(--st-building-tint)" },
  ripe: { label: "ناضجة", color: "var(--st-ripe)", tint: "var(--st-ripe-tint)" },
  freed: { label: "معزولة", color: "var(--st-freed)", tint: "var(--st-freed-tint)" },
};

/* ────────────────────────────────────────────────────────────
   لإضافة فكرة:
     ١. أنشئ  ideas/<slug>/view.tsx  يُصدّر مكوّناً افتراضياً
     ٢. أضف سطراً في ideas أدناه
     ٣. أضف سطراً في views أدناه
   لنزعها: احذف الثلاثة.
   ──────────────────────────────────────────────────────────── */

export const ideas: Idea[] = [
  {
    slug: "taqwimayn",
    title: "التقويمان",
    summary: "تحويل بين الهجري والميلادي، في الاتجاهين، بلا مكتبات.",
    status: "building",
    tags: ["تاريخ", "أدوات"],
    started: "2026-11",
  },
];

export const views: Record<string, ComponentType> = {
  taqwimayn: dynamic(() => import("./taqwimayn/view")),
};

export function getIdea(slug: string): Idea | undefined {
  return ideas.find((i) => i.slug === slug);
}
