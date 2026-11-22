const nf = new Intl.NumberFormat("ar-SA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** مبلغ بالريال — الرمز بعد الرقم كما يُقرأ في السعودية */
export const money = (n: number) => `${nf.format(Number(n) || 0)} ر.س`;

const timeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  hour: "numeric",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  day: "numeric",
  month: "short",
});

export const timeOf = (iso: string) => timeFmt.format(new Date(iso));
export const dateOf = (iso: string) => dateFmt.format(new Date(iso));

/** «قبل ٣ دقائق» — يكفي المطبخ لمعرفة عمر الطلب بلمحة */
export function sinceText(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - +new Date(iso)) / 60000));
  if (min < 1) return "الآن";
  if (min === 1) return "قبل دقيقة";
  if (min === 2) return "قبل دقيقتين";
  if (min < 60) return `قبل ${min} دقيقة`;
  const h = Math.round(min / 60);
  if (h === 1) return "قبل ساعة";
  if (h === 2) return "قبل ساعتين";
  if (h < 24) return `قبل ${h} ساعات`;
  const d = Math.round(h / 24);
  return d === 1 ? "أمس" : `قبل ${d} أيام`;
}

/** دقائق مرّت — للعدّاد الحيّ في المطبخ */
export const minutesSince = (iso: string, now = Date.now()) =>
  Math.max(0, Math.floor((now - +new Date(iso)) / 60000));

export const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
