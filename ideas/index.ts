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

/** موقع مجمّع: عدة أدوات تحت مظلّة واحدة في القائمة الجانبية */
export type Group = {
  slug: string;
  title: string;
  summary: string;
  icon: AppIcon;
};

export type Idea = {
  /** لا تظهر في القائمة ولا الفهرس — صفحة موقع مجمّع أو ما شابه */
  hidden?: boolean;
  /** خلفية شاشة الإقلاع — لون سطح الأداة لا بلاطة أيقونتها */
  appBg?: string;
  /** إن كانت الأداة جزءًا من موقع مجمّع */
  group?: string;
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

export const groups: Group[] = [
  {
    slug: "matam",
    title: "مطعم",
    summary: "نظام متكامل: العميل والمطبخ والإدارة والمندوب.",
    icon: {
      bg: "#d1492a",
      fg: "#ffffff",
      // شوكة وسكين
      path: "M8 3v7a2 2 0 0 0 4 0V3M10 10v11M16 3c-1.4 2-2 4-2 7h4c0-3-.6-5-2-7zM16 10v11",
      stroke: 1.8,
    },
  },
];

export const ideas: Idea[] = [
  {
    slug: "nashat",
    appBg: "#0f1419",
    title: "نشاط",
    summary: "سجلّ العمل اليومي: جلسات ومقاطعات وإحصاءات تركيز.",
    tags: ["إنتاجية", "وقت"],
    started: "2026-09",
    icon: {
      bg: "#0f1419",
      fg: "#4ea8de",
      // ساعة: دائرة وعقربان
      path: "M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6ZM12 7.4V12l3.4 2.2",
      stroke: 1.8,
    },
  },
  {
    slug: "matam",
    hidden: true,
    appBg: "#15110f",
    title: "مطعم",
    summary: "نظام المطعم: العميل والمطبخ والإدارة والمندوب في شاشة واحدة.",
    tags: ["مطعم"],
    started: "2026-11",
    icon: {
      bg: "#d1492a",
      fg: "#ffffff",
      path: "M8 3v7a2 2 0 0 0 4 0V3M10 10v11M16 3c-1.4 2-2 4-2 7h4c0-3-.6-5-2-7zM16 10v11",
      stroke: 1.8,
    },
  },
  {
    slug: "matam-customer",
    appBg: "#f7f5f2",
    group: "matam",
    title: "العميل",
    summary: "تصفّح القائمة، اطلب، وتابع طلبك لحظة بلحظة.",
    tags: ["مطعم", "عميل"],
    started: "2026-11",
    icon: {
      bg: "#d1492a",
      fg: "#ffffff",
      // كيس طلبات
      path: "M5.5 8h13l-1 12.5h-11zM9 8V6a3 3 0 0 1 6 0v2",
      stroke: 1.7,
    },
  },
  {
    slug: "matam-kitchen",
    appBg: "#f7f5f2",
    group: "matam",
    title: "المطبخ",
    summary: "الطلبات الواردة ومسارها حتى الجاهزية.",
    tags: ["مطعم", "مطبخ"],
    started: "2026-11",
    icon: {
      bg: "#2e7d57",
      fg: "#ffffff",
      // قبّعة طاهٍ
      path: "M6 20h12v-6a4 4 0 1 0-2.6-7 4 4 0 0 0-6.8 0A4 4 0 1 0 6 14zM6 16.5h12",
      stroke: 1.7,
    },
  },
  {
    slug: "matam-admin",
    appBg: "#f7f5f2",
    group: "matam",
    title: "الإدارة",
    summary: "القائمة والطلبات والمندوبون والتقارير والإعدادات.",
    tags: ["مطعم", "إدارة"],
    started: "2026-11",
    icon: {
      bg: "#2f6fa8",
      fg: "#ffffff",
      // أعمدة بيانية
      path: "M5 20V11M12 20V5M19 20v-6",
      stroke: 2.2,
    },
  },
  {
    slug: "matam-driver",
    appBg: "#f7f5f2",
    group: "matam",
    title: "المندوب",
    summary: "الطلبات الجاهزة، استلامها، وتسليمها.",
    tags: ["مطعم", "توصيل"],
    started: "2026-11",
    icon: {
      bg: "#b8791a",
      fg: "#ffffff",
      // دبّوس موقع
      path: "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 10.2v.1",
      stroke: 1.7,
    },
  },
];

export const views: Record<string, ComponentType> = {
  nashat: dynamic(() => import("./nashat/view")),
  matam: dynamic(() => import("./matam-bench/view")),
  "matam-customer": dynamic(() => import("./matam-customer/view")),
  "matam-kitchen": dynamic(() => import("./matam-kitchen/view")),
  "matam-admin": dynamic(() => import("./matam-admin/view")),
  "matam-driver": dynamic(() => import("./matam-driver/view")),
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

export const getGroup = (slug: string): Group | undefined =>
  groups.find((g) => g.slug === slug);

/** أدوات موقع مجمّع */
export const groupIdeas = (slug: string): Idea[] =>
  ideas.filter((i) => i.group === slug);

/** الأدوات المستقلة — ما لا ينتمي إلى مجموعة */
export const soloIdeas = (): Idea[] =>
  ideas.filter((i) => !i.group && !i.hidden);
