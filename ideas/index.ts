import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** هوية الأداة حين تُثبَّت كتطبيق مستقل */
export type AppIcon = {
  /** لون الخلفية */
  bg: string;
  /** لون الرسم */
  fg: string;
  /** مسار SVG داخل مربّع 24×24 */
  path: string;
  /** سماكة الخط، أو "fill" للمسارات المملوءة */
  stroke?: number | "fill";
};

export type Idea = {
  /** المعرّف في الرابط: ‎/lab/<slug> */
  slug: string;
  title: string;
  /** سطر واحد يظهر في الفهرس */
  summary: string;
  tags: string[];
  /** متى بدأت — بصيغة YYYY-MM */
  started: string;
  /** أيقونة التطبيق المستقل */
  icon: AppIcon;
  /** يُملأ حين تنتقل الفكرة إلى مشروع مستقل */
  movedUrl?: string;
};

/* ────────────────────────────────────────────────────────────
   لإضافة أداة:
     ١. أنشئ  ideas/<slug>/view.tsx  يُصدّر مكوّناً افتراضياً
     ٢. أضف سطراً في ideas أدناه، ومعه أيقونته
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
    icon: {
      bg: "#1a1a1a",
      fg: "#6e8fb5",
      // ساعة: دائرة وعقربان
      path: "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6ZM12 7.4V12l3.4 2.2",
      stroke: 1.8,
    },
  },
];

export const views: Record<string, ComponentType> = {
  nashat: dynamic(() => import("./nashat/view")),
};

export function getIdea(slug: string): Idea | undefined {
  return ideas.find((i) => i.slug === slug);
}

/** رسم أيقونة الأداة كنصّ SVG — يُستعمل للتطبيق المستقل وللصفحة */
export function iconSvg(icon: AppIcon, size = 512): string {
  const r = Math.round(size * 0.22);
  const inset = size * 0.22;
  const scale = (size - inset * 2) / 24;
  const draw =
    icon.stroke === "fill"
      ? `<path d="${icon.path}" fill="${icon.fg}"/>`
      : `<path d="${icon.path}" fill="none" stroke="${icon.fg}" stroke-width="${icon.stroke ?? 1.8}" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${icon.bg}"/>
  <g transform="translate(${inset} ${inset}) scale(${scale})">${draw}</g>
</svg>`;
}
