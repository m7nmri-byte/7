import type { Indicator, IndicatorResult, Objective, Perspective } from "../types";

export const QUARTERS = ["q1", "q2", "q3", "q4"] as const;
export type Quarter = (typeof QUARTERS)[number];
export type Period = Quarter | "year";

export const PERIOD_LABEL: Record<Period, string> = {
  q1: "الربع الأول",
  q2: "الربع الثاني",
  q3: "الربع الثالث",
  q4: "الربع الرابع",
  year: "السنة",
};

export const FREQUENCY_LABEL: Record<string, string> = {
  quarterly: "ربع سنوي",
  semi: "نصف سنوي",
  yearly: "سنوي",
};

/** الأرباع التي تُقاس فعلًا بحسب دورية المؤشّر */
export function measuredQuarters(frequency: string): Quarter[] {
  if (frequency === "yearly") return ["q4"];
  if (frequency === "semi") return ["q2", "q4"];
  return [...QUARTERS];
}

const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export type ResultMap = Map<string, IndicatorResult>;

/** مفتاح النتيجة: مؤشّر وسنة وفترة */
export const resultKey = (indicatorId: string, year: number, period: Period) =>
  `${indicatorId}|${year}|${period}`;

export function indexResults(rows: IndicatorResult[]): ResultMap {
  const m: ResultMap = new Map();
  for (const r of rows) m.set(resultKey(r.indicator_id, r.year, r.period as Period), r);
  return m;
}

/**
 * المتحقق السنوي.
 *
 * هذه قاعدة الجمعية لا اجتهادًا:
 *   غير التراكمي يبدأ من الصفر كل ربع، فالسنوي مجموع الأرباع.
 *   التراكمي قيمته مستوًى قائم يحتوي آخرُ قياسٍ له ما قبله، فالسنوي
 *   آخر ربعٍ له متحقق — وجمعُه يُخرج نسبًا كاذبة تتجاوز ٣٠٠٪.
 *
 * وقيمةٌ أُدخلت يدويًا في فترة «السنة» تتجاوز الحساب كلّه: الموظف
 * أدخلها عن علم، فلا يُغيّرها النظام من تحته.
 */
export function annualActual(
  indicator: Indicator,
  year: number,
  results: ResultMap,
): number | null {
  const manual = results.get(resultKey(indicator.id, year, "year"));
  if (manual?.is_override) return num(manual.actual);

  const quarters = measuredQuarters(indicator.frequency)
    .map((q) => results.get(resultKey(indicator.id, year, q)))
    .filter((r): r is IndicatorResult => Boolean(r))
    /** المؤجَّل لا قيمة له ولا يُحتسب، و«بلا بيانات» صفر */
    .filter((r) => r.state !== "postponed");

  if (!quarters.length) return num(manual?.actual ?? null);

  if (indicator.cumulative) {
    const withValue = quarters.filter((r) => num(r.actual) !== null);
    if (!withValue.length) return null;
    return num(withValue[withValue.length - 1].actual);
  }

  return quarters.reduce((s, r) => s + (r.state === "no_data" ? 0 : (num(r.actual) ?? 0)), 0);
}

/** المستهدف السنوي — بالقاعدة نفسها */
export function annualTarget(
  indicator: Indicator,
  year: number,
  results: ResultMap,
): number | null {
  const manual = results.get(resultKey(indicator.id, year, "year"));
  const direct = num(manual?.target ?? null);
  if (direct !== null) return direct;

  const quarters = measuredQuarters(indicator.frequency)
    .map((q) => results.get(resultKey(indicator.id, year, q)))
    .filter((r): r is IndicatorResult => Boolean(r))
    .filter((r) => r.state !== "postponed");

  const targets = quarters.map((r) => num(r.target)).filter((v): v is number => v !== null);
  if (!targets.length) return null;

  return indicator.cumulative ? targets[targets.length - 1] : targets.reduce((a, b) => a + b, 0);
}

/**
 * نسبة الإنجاز.
 *
 * واتجاه التحسّن معتبر: مؤشّرٌ المطلوب فيه النقص — كشكاوى أو تكلفة —
 * إنجازُه أن يقلّ، فقسمة المتحقق على المستهدف تقلبه فتكافئ الأسوأ.
 */
export function achievement(
  indicator: Indicator,
  actual: number | null,
  target: number | null,
): number | null {
  if (actual === null || target === null) return null;

  if (indicator.polarity === "down") {
    if (actual <= 0) return target <= 0 ? 100 : 200;
    return Math.max(0, (target / actual) * 100);
  }

  if (target === 0) return actual > 0 ? 100 : 0;
  return Math.max(0, (actual / target) * 100);
}

export const achievementTone = (pct: number | null) => {
  if (pct === null) return "var(--j-faint)";
  if (pct >= 100) return "var(--j-ok)";
  if (pct >= 70) return "var(--j-warn)";
  return "var(--j-danger)";
};

/**
 * متوسّط إنجاز مجموعة مؤشّرات.
 * المؤشّر الذي لا متحقق له ولا مستهدف يُترك خارج القسمة، فلا يُنزل
 * المتوسّط بصفرٍ لم يُقَس.
 */
export function averageAchievement(
  indicators: Indicator[],
  year: number,
  results: ResultMap,
): { pct: number | null; measured: number; total: number } {
  const values: number[] = [];
  for (const ind of indicators) {
    const pct = achievement(
      ind,
      annualActual(ind, year, results),
      annualTarget(ind, year, results),
    );
    if (pct !== null) values.push(pct);
  }
  return {
    pct: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    measured: values.length,
    total: indicators.length,
  };
}

/** الرمز التالي لهدفٍ داخل منظور: «س 1» ثم «س 2» */
export function nextObjectiveCode(prefix: string, siblings: Objective[]): string {
  const top = siblings.reduce((max, o) => {
    const n = Number((o.code.match(/(\d+)\s*$/) ?? [])[1]);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `${prefix} ${top + 1}`;
}

/** الرمز التالي لمؤشّر داخل هدف: «س 1 - 1» ثم «س 1 - 2» */
export function nextIndicatorCode(objectiveCode: string, siblings: Indicator[]): string {
  const top = siblings.reduce((max, i) => {
    const n = Number((i.code.match(/(\d+)\s*$/) ?? [])[1]);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `${objectiveCode} - ${top + 1}`;
}

/** المنظورات مرتّبة ومعها أهدافها ومؤشّراتها */
export type Tree = {
  perspective: Perspective;
  objectives: { objective: Objective; indicators: Indicator[] }[];
}[];

export function buildTree(
  perspectives: Perspective[],
  objectives: Objective[],
  indicators: Indicator[],
): Tree {
  const byOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;
  return [...perspectives].sort(byOrder).map((perspective) => ({
    perspective,
    objectives: objectives
      .filter((o) => o.perspective_id === perspective.id)
      .sort(byOrder)
      .map((objective) => ({
        objective,
        indicators: indicators.filter((i) => i.objective_id === objective.id).sort(byOrder),
      })),
  }));
}

/* ===================== الخطة التشغيلية ===================== */

/**
 * نسبة إنجاز المبادرة: متوسّط خطواتها موزونًا بمدّتها المخطّطة.
 * فخطوةٌ تمتدّ ثمانية أسابيع ليست كخطوةٍ تمتدّ أسبوعًا، والمتوسّط
 * البسيط يسوّي بينهما فيُجمّل المتعثّر.
 */
export function initiativeProgress(steps: { progress: number; plan_weeks: number | null }[]) {
  if (!steps.length) return 0;
  const weight = (s: { plan_weeks: number | null }) => Math.max(1, Number(s.plan_weeks) || 1);
  const total = steps.reduce((sum, s) => sum + weight(s), 0);
  const done = steps.reduce((sum, s) => sum + weight(s) * Math.min(100, Math.max(0, s.progress)), 0);
  return Math.round(done / total);
}

/** أشهر الخطة بصيغة YYYY-MM — مفاتيح توزيع الموازنة */
export function planMonths(start: string, end: string): string[] {
  const out: string[] = [];
  const a = new Date(start + "T12:00:00");
  const b = new Date(end + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return out;
  const cur = new Date(a.getFullYear(), a.getMonth(), 1);
  while (cur <= b) {
    out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

/** عدد أسابيع الخطة — يُشتقّ من مداها فلا يُدخل يدويًا ويتناقض معه */
export const weeksBetween = (start: string, end: string) => {
  const a = Date.parse(start + "T00:00:00");
  const b = Date.parse(end + "T23:59:59");
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.ceil((b - a) / (7 * 86400000));
};

export const sumValues = (obj: Record<string, number> | null | undefined) =>
  obj ? Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
