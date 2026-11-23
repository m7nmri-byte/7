import type { EntryKind, LedgerEntry } from "../types";

export const INCOME_CATEGORIES = [
  "تبرّع نقدي",
  "منحة",
  "اشتراكات",
  "ريع وقف",
  "إيراد أنشطة",
  "إيراد آخر",
];

export const EXPENSE_CATEGORIES = [
  "مساعدات مستفيدين",
  "رواتب ومكافآت",
  "إيجارات",
  "مرافق وخدمات",
  "تشغيل برامج",
  "مواصلات",
  "قرطاسية وتجهيزات",
  "تسويق وإعلام",
  "رسوم حكومية",
  "مصروف آخر",
];

export const categoriesFor = (kind: EntryKind) =>
  kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

export type Period = "month" | "quarter" | "year" | "all";

export const PERIOD_LABEL: Record<Period, string> = {
  month: "هذا الشهر",
  quarter: "هذا الربع",
  year: "السنة المالية",
  all: "كل الفترات",
};

/**
 * بداية الفترة بحسب السنة المالية للجمعية.
 * `fiscalStart` شهر من ١ إلى ١٢، فالسنة المالية قد لا تبدأ في يناير.
 */
export function periodStart(period: Period, fiscalStart: number, now: Date): string | null {
  if (period === "all") return null;
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "month") return iso(y, m, 1);
  if (period === "quarter") return iso(y, m - (m % 3), 1);

  const fsMonth = Math.min(12, Math.max(1, fiscalStart)) - 1;
  /** إن لم يبلغ العام شهر البداية بعد، فنحن في السنة المالية التي بدأت العام الماضي */
  const startYear = m >= fsMonth ? y : y - 1;
  return iso(startYear, fsMonth, 1);
}

function iso(y: number, m: number, d: number) {
  const date = new Date(y, m, d);
  const p = (n: number) => String(n).padStart(2, "0");
  return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate());
}

export type Totals = {
  income: number;
  expense: number;
  net: number;
  byCategory: { category: string; kind: EntryKind; amount: number }[];
};

export function totalsOf(entries: LedgerEntry[]): Totals {
  let income = 0;
  let expense = 0;
  const map = new Map<string, { category: string; kind: EntryKind; amount: number }>();

  for (const e of entries) {
    const amount = Number(e.amount) || 0;
    if (e.kind === "income") income += amount;
    else expense += amount;

    const key = e.kind + "|" + e.category;
    const cur = map.get(key) ?? { category: e.category, kind: e.kind, amount: 0 };
    cur.amount += amount;
    map.set(key, cur);
  }

  return {
    income,
    expense,
    net: income - expense,
    byCategory: [...map.values()].sort((a, b) => b.amount - a.amount),
  };
}

/** الرصيد التراكمي بترتيب التاريخ تصاعديًا — يُحسب مرّة ويُقرأ بالمعرّف */
export function runningBalance(entries: LedgerEntry[]): Map<string, number> {
  const asc = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const out = new Map<string, number>();
  let bal = 0;
  for (const e of asc) {
    bal += e.kind === "income" ? Number(e.amount) : -Number(e.amount);
    out.set(e.id, bal);
  }
  return out;
}

/** شهور الفترة لرسم الاتجاه — مفتاح YYYY-MM مرتّب تصاعديًا */
export function monthlyFlow(entries: LedgerEntry[]) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const e of entries) {
    const key = e.entry_date.slice(0, 7);
    const cur = map.get(key) ?? { income: 0, expense: 0 };
    if (e.kind === "income") cur.income += Number(e.amount);
    else cur.expense += Number(e.amount);
    map.set(key, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, ...v }));
}

export function toCsv(entries: LedgerEntry[], name: (id: string | null) => string) {
  const head = ["التاريخ", "النوع", "التصنيف", "الوصف", "البرنامج", "المبلغ"];
  const rows = entries.map((e) => [
    e.entry_date,
    e.kind === "income" ? "إيراد" : "مصروف",
    e.category,
    e.description ?? "",
    name(e.program_id),
    String(e.amount),
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => '"' + c.replace(/"/g, '""') + '"').join(","))
    .join("\n");
}
