/** تحويل بين التقويمين بالاعتماد على Intl وحده — بلا مكتبات خارجية. */

export type Ymd = { y: number; m: number; d: number };

const CAL = "islamic-umalqura";

const hijriParts = new Intl.DateTimeFormat(`en-u-ca-${CAL}-nu-latn`, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

/** ميلادي ← هجري */
export function toHijri(date: Date): Ymd {
  const p = hijriParts.formatToParts(date);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function cmp(a: Ymd, b: Ymd): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

const DAY = 86_400_000;

/** هجري ← ميلادي، ببحث ثنائي على المحور الزمني */
export function fromHijri(target: Ymd): Date | null {
  let lo = Date.UTC(622, 6, 1);
  let hi = Date.UTC(2200, 0, 1);
  if (cmp(toHijri(new Date(lo)), target) > 0) return null;
  if (cmp(toHijri(new Date(hi)), target) < 0) return null;

  while (hi - lo > DAY) {
    const mid = lo + Math.floor((hi - lo) / 2 / DAY) * DAY;
    if (cmp(toHijri(new Date(mid)), target) < 0) lo = mid;
    else hi = mid;
  }
  const found = new Date(cmp(toHijri(new Date(lo)), target) === 0 ? lo : hi);
  return cmp(toHijri(found), target) === 0 ? found : null;
}

export const HIJRI_MONTHS = [
  "محرّم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوّال", "ذو القعدة", "ذو الحجّة",
];

const weekday = new Intl.DateTimeFormat("ar", { weekday: "long", timeZone: "UTC" });
const gregorian = new Intl.DateTimeFormat("ar", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

export const dayName = (d: Date) => weekday.format(d);
export const gregorianText = (d: Date) => gregorian.format(d);
export const hijriText = (h: Ymd) =>
  `${h.d} ${HIJRI_MONTHS[h.m - 1]} ${h.y} هـ`;

/** عدد أيام الشهر الهجري المعطى */
export function hijriMonthLength(y: number, m: number): number {
  for (const d of [30, 29]) if (fromHijri({ y, m, d })) return d;
  return 29;
}
