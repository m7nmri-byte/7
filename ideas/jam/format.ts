const nf = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 });

export const money = (n: number | null | undefined) =>
  `${nf.format(Number(n) || 0)} ر.س`;

export const num = (n: number | null | undefined) => nf.format(Number(n) || 0);

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  hour: "numeric",
  minute: "2-digit",
});

export const fmtDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const fmtTime = (iso: string | null) => (iso ? timeFmt.format(new Date(iso)) : "—");

export function sinceText(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - +new Date(iso)) / 60000));
  if (min < 1) return "الآن";
  if (min < 60) return `قبل ${min} دقيقة`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "قبل ساعة" : h === 2 ? "قبل ساعتين" : `قبل ${h} ساعات`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? "أمس" : `قبل ${d} أيام`;
  return fmtDate(iso);
}

/** الفرق بالأيام — موجب يعني في المستقبل */
export const daysUntil = (date: string) =>
  Math.ceil((+new Date(date) - Date.now()) / 86_400_000);

export const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
