const pad = (n: number) => String(n).padStart(2, "0");

export const DAY_MS = 86_400_000;

/* ---------- تحويل بين التاريخ ونص اليوم ---------- */

export const toDayStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDayStr(new Date());
export const dayOf = (iso: string) => toDayStr(new Date(iso));
export const nowISO = () => new Date().toISOString();

/** منتصف الليل الذي يبدأ به اليوم، ونهايته */
export function dayBounds(day: string): [number, number] {
  const start = new Date(`${day}T00:00:00`).getTime();
  return [start, start + DAY_MS];
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toDayStr(d);
}

/* ---------- عرض الوقت ---------- */

export function fmtTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const fmtPeriod = (iso: string) =>
  new Date(iso).getHours() < 12 ? "ص" : "م";

/** ساعات:دقائق — لمجموع اليوم */
export function fmtHM(ms: number) {
  const m = Math.floor(Math.max(0, ms) / 60000);
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

/** مدة مختصرة: تُظهر الساعات فقط عند الحاجة */
export function fmtDur(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0
    ? `${h}:${pad(m)}:${pad(s % 60)}`
    : `${m}:${pad(s % 60)}`;
}

/** مدة كاملة بخانات ثابتة — لمؤقّت ملء الشاشة */
export function fmtDurLong(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** دقائق مقروءة: «٤٥د» أو «1:20» */
export function minsLabel(min: number) {
  const m = Math.round(min);
  return m < 60 ? `${m}د` : `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

/** الساعة بنظام ١٢ مع ص/م — لنصوص الرسوم */
export function fmt12(h: number) {
  const x = ((h % 24) + 24) % 24;
  return `${x % 12 || 12}${x < 12 ? "ص" : "م"}`;
}

/* ---------- أسماء الأيام ---------- */

const arDateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const arShortFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "short",
});

export const arDate = (day: string) => arDateFmt.format(new Date(`${day}T12:00:00`));

export function shortDayLabel(day: string) {
  const t = todayStr();
  if (day === t) return "اليوم";
  if (day === addDays(t, -1)) return "أمس";
  if (day === addDays(t, 1)) return "غدًا";
  return arShortFmt.format(new Date(`${day}T12:00:00`));
}

export const AR_WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

/** معرّف قصير يكفي للتمييز داخل جهاز واحد */
export const uid = () =>
  "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
