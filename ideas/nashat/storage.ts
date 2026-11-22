import type { Category, Memo, State, Task, TaskStatus } from "./types";
import { dayOf, todayStr, uid } from "./time";

const KEY = "nashat.state.v2";
/** مفاتيح النسخة القديمة (الملف المفرد) — تُقرأ مرة ثم تُترك */
const LEGACY_TASKS = "nashat_tasks_v1";
const LEGACY_MEMO = "nashat_memo_v1";

export const emptyState = (): State => ({ tasks: [], memo: [] });

const CATEGORIES = new Set<Category>(["work", "rest", "waste"]);
const STATUSES = new Set<TaskStatus>(["active", "completed", "interrupted"]);

/**
 * تنظيف مهمة قادمة من مصدر خارجي — تخزين قديم أو ملف مستورد.
 * النسخة الأصلية كانت تُسقط الفئة عند الاستيراد فتعود كل المهام «عمل»؛
 * هنا تُحفظ متى كانت صالحة.
 */
export function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const segments = Array.isArray(t.segments) ? t.segments : null;
  if (!segments?.length) return null;

  const clean = segments
    .map((s) => {
      const seg = s as Record<string, unknown>;
      if (typeof seg.start !== "string") return null;
      return {
        start: seg.start,
        end: typeof seg.end === "string" ? seg.end : null,
        day: typeof seg.day === "string" ? seg.day : dayOf(seg.start),
      };
    })
    .filter((s): s is Task["segments"][number] => s !== null);
  if (!clean.length) return null;

  const status = t.status as TaskStatus;
  const category = t.category as Category;

  return {
    id: typeof t.id === "string" && t.id ? t.id : uid(),
    name: typeof t.name === "string" && t.name.trim() ? t.name : "بدون اسم",
    status: STATUSES.has(status) ? status : "completed",
    category: CATEGORIES.has(category) ? category : "work",
    ...(t.dismissed ? { dismissed: true } : {}),
    segments: clean,
    steps: (Array.isArray(t.steps) ? t.steps : []).map((s) =>
      typeof s === "string"
        ? { text: s, day: todayStr() }
        : {
            text: String((s as Record<string, unknown>)?.text ?? ""),
            day: String((s as Record<string, unknown>)?.day ?? todayStr()),
          },
    ),
  };
}

function normalizeMemo(raw: unknown): Memo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) =>
      typeof m === "string"
        ? { id: uid(), text: m }
        : {
            id: String((m as Record<string, unknown>)?.id ?? uid()),
            text: String((m as Record<string, unknown>)?.text ?? ""),
          },
    )
    .filter((m) => m.text.trim());
}

export function normalizeState(raw: unknown): State {
  if (!raw || typeof raw !== "object") return emptyState();
  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.tasks) ? o.tasks : Array.isArray(raw) ? raw : [];
  return {
    tasks: list.map(normalizeTask).filter((t): t is Task => t !== null),
    memo: normalizeMemo(o.memo),
  };
}

/* ===================== التخزين المحلي ===================== */

export function loadLocal(): State {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalizeState(JSON.parse(raw));

    // ترحيل من النسخة القديمة، مرة واحدة
    const legacy = localStorage.getItem(LEGACY_TASKS);
    if (legacy) {
      const state = normalizeState({
        tasks: JSON.parse(legacy),
        memo: JSON.parse(localStorage.getItem(LEGACY_MEMO) ?? "[]"),
      });
      saveLocal(state);
      return state;
    }
  } catch {
    /* تخزين معطوب أو ممنوع — نبدأ فارغين */
  }
  return emptyState();
}

export function saveLocal(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* الحصة ممتلئة أو التخزين ممنوع — تبقى الحالة في الذاكرة */
  }
}

/**
 * مقياس تقريبي لكمّ المسجَّل: عدد الجلسات والخطوات.
 * يُستعمل لمنع نسخة خادم أقدم من محو عمل حديث ما زال في الطريق.
 */
export const metric = (tasks: Task[]) =>
  tasks.reduce((n, t) => n + t.segments.length + t.steps.length, 0);

/* ===================== الاستيراد ===================== */

/** دمج ملف مستورد مع الحالة الحالية — لا يُحذف شيء، والمطابق بالمعرّف يُحدَّث */
export function mergeImported(current: State, raw: unknown): { state: State; added: number } {
  const incoming = normalizeState(raw);
  if (!incoming.tasks.length) return { state: current, added: 0 };

  const byId = new Map(current.tasks.map((t) => [t.id, t]));
  for (const t of incoming.tasks) byId.set(t.id, t);

  const memoTexts = new Set(current.memo.map((m) => m.text));
  const memo = [...current.memo, ...incoming.memo.filter((m) => !memoTexts.has(m.text))];

  return { state: { tasks: [...byId.values()], memo }, added: incoming.tasks.length };
}
