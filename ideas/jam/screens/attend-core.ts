import type { Attendance, AttendanceStatus, Shift, Site } from "../types";

/** المسافة بين نقطتين بالمتر — صيغة هافرساين */
export function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

/** أقرب موقع عمل للنقطة، مع مسافته */
export function nearestSite(sites: Site[], at: { lat: number; lng: number }) {
  let best: { site: Site; distance: number } | null = null;
  for (const s of sites) {
    if (!s.is_active || s.lat == null || s.lng == null) continue;
    const d = distanceM(at, { lat: s.lat, lng: s.lng });
    if (!best || d < best.distance) best = { site: s, distance: d };
  }
  return best;
}

/** «08:15» إلى دقائق من منتصف الليل */
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * حالة البصمة: حاضر أم متأخّر.
 * التأخّر يُقاس من بداية الدوام زائد مهلة المجموعة — لا من الدقيقة
 * الأولى، فخمس دقائق ليست تأخّرًا في أي نظام عادل.
 */
export function statusFor(shift: Shift | null, at: Date, remote: boolean): AttendanceStatus {
  if (remote) return "remote";
  if (!shift) return "present";
  const now = at.getHours() * 60 + at.getMinutes();
  return now > minutesOf(shift.start_time) + shift.late_after_minutes ? "late" : "present";
}

/** هل اليوم يوم عمل لهذه المجموعة؟ */
export const isWorkDay = (shift: Shift | null, date: Date) =>
  !shift || shift.work_days.includes(date.getDay());

export type DaySummary = {
  present: number;
  late: number;
  remote: number;
  leave: number;
  absent: number;
};

export function summarize(
  records: Attendance[],
  totalMembers: number,
  onLeave: number,
): DaySummary {
  const count = (s: AttendanceStatus) => records.filter((r) => r.status === s).length;
  const present = count("present");
  const late = count("late");
  const remote = count("remote");
  return {
    present,
    late,
    remote,
    leave: onLeave,
    absent: Math.max(0, totalMembers - present - late - remote - onLeave),
  };
}

/* ===================== قبول البصمة ===================== */

export type PunchVerdict =
  | { ok: true; site: Site | null; distance: number | null; remote: boolean }
  | { ok: false; reason: string };

/**
 * هل تُقبل هذه البصمة؟
 *
 * «نطاق القبول» في الإعدادات كان يُحسب ويُسجَّل ولا يَقبل ولا يَرفض:
 * من بصم خارج النطاق يُسجَّل حاضرًا، ومن منع تحديد موقعه يُسجَّل
 * حاضرًا كذلك — فالموقع كلّه زينة. والقرار هنا في مكان واحد:
 *
 * - من يُسمح له بالعمل عن بُعد تُقبل بصمته أينما كان، وتُوسم «عن بُعد».
 * - من لا يُسمح له فلا بدّ من موقعٍ داخل نطاق موقعٍ مفعَّل.
 * - ولا مواقع محفوظة أصلًا؟ فلا نطاق يُحتكم إليه، فتُقبل.
 */
export function verdictFor(
  sites: Site[],
  at: { lat: number; lng: number } | null,
  remoteAllowed: boolean,
): PunchVerdict {
  const usable = sites.filter((s) => s.is_active && s.lat != null && s.lng != null);

  if (usable.length === 0) {
    return { ok: true, site: null, distance: null, remote: false };
  }

  if (!at) {
    if (remoteAllowed) return { ok: true, site: null, distance: null, remote: true };
    return {
      ok: false,
      reason: "تعذّر تحديد موقعك. اسمح بالموقع ثم أعد المحاولة.",
    };
  }

  const near = nearestSite(usable, at);
  if (!near) return { ok: true, site: null, distance: null, remote: false };

  if (near.distance <= near.site.radius_m) {
    return { ok: true, site: near.site, distance: near.distance, remote: false };
  }

  if (remoteAllowed) {
    return { ok: true, site: near.site, distance: near.distance, remote: true };
  }

  return {
    ok: false,
    reason: `أنت على بعد ${near.distance} م من ${near.site.name}، والنطاق المسموح ${near.site.radius_m} م.`,
  };
}
