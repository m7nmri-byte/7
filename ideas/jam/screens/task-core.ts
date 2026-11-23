import type { Task, TaskStatus } from "../types";
import { daysUntil } from "../format";

export const STATUS_TONE: Record<TaskStatus, string> = {
  todo: "var(--j-faint)",
  doing: "var(--j-info)",
  done: "var(--j-ok)",
  blocked: "var(--j-danger)",
};

export const PRIORITY = [
  { v: 1, label: "عاجل", tone: "var(--j-danger)" },
  { v: 2, label: "مهم", tone: "var(--j-warn)" },
  { v: 3, label: "عادي", tone: "var(--j-faint)" },
];

/** لون موعد التسليم: يشتدّ كلما اقترب أو فات */
export function dueTone(date: string | null, status: TaskStatus) {
  if (!date || status === "done") return "var(--j-faint)";
  const d = daysUntil(date);
  if (d < 0) return "var(--j-danger)";
  if (d <= 1) return "var(--j-warn)";
  return "var(--j-faint)";
}

/** الحالة التالية في دورة بسيطة: لم تبدأ ← جارية ← مكتملة */
export const nextStatus = (s: TaskStatus): TaskStatus =>
  s === "todo" ? "doing" : s === "doing" ? "done" : "todo";

/** الترتيب: الأعجل أولًا، ثم الأقرب موعدًا */
export const sortTasks = (list: Task[]) =>
  [...list].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
  });

/* ===================== التكرار ===================== */

const isoDay = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * موعد النسخة التالية من مهمة متكرّرة.
 *
 * يُحسب من موعد المهمة المنتهية لا من اليوم، فالمهمة الأسبوعية
 * التي أُنجزت متأخّرة يومين تبقى على يومها من الأسبوع ولا يزحف
 * موعدها مع كل تأخير.
 *
 * والشهري يُقاس بآخر يوم في الشهر: ٣١ يناير التالي ٢٨ فبراير لا
 * ٣ مارس — وهو ما يفعله `setMonth` وحده إن تُرك.
 */
export function nextDue(recurrence: string, from: string | null): string | null {
  const base = from ? new Date(from + "T12:00:00") : new Date();
  if (Number.isNaN(base.getTime())) return null;

  if (recurrence === "daily") {
    base.setDate(base.getDate() + 1);
    return isoDay(base);
  }
  if (recurrence === "weekly") {
    base.setDate(base.getDate() + 7);
    return isoDay(base);
  }
  if (recurrence === "monthly") {
    const day = base.getDate();
    base.setDate(1);
    base.setMonth(base.getMonth() + 1);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(day, lastDay));
    return isoDay(base);
  }
  return null;
}

/**
 * صفّ النسخة التالية من مهمة متكرّرة، أو null إن لم تكن متكرّرة.
 *
 * التكرار كان حقلًا يُحفظ ووسمًا يظهر ولا شيء بعده: تُنجز المهمة
 * «اليومية» فتنتهي إلى الأبد. فالنسخة تُنشأ عند الإنجاز، وهي
 * شقيقة لا ابنة — فلا تُحسب مهمةً فرعية.
 */
export function nextOccurrence(task: Task): Record<string, unknown> | null {
  if (!task.recurrence) return null;
  const due = nextDue(task.recurrence, task.due_date);
  if (!due) return null;

  return {
    title: task.title,
    body: task.body,
    assignee_id: task.assignee_id,
    creator_id: task.creator_id,
    department_id: task.department_id,
    status: "todo",
    priority: task.priority,
    due_date: due,
    recurrence: task.recurrence,
    attachments: task.attachments,
    meeting_id: task.meeting_id,
    parent_id: null,
    done_at: null,
    done_note: null,
    proof_url: null,
  };
}

/** هل أُنشئت النسخة التالية سابقًا؟ يمنع تكرارًا مزدوجًا عند إعادة الإغلاق */
export const hasNext = (list: Task[], task: Task, due: string) =>
  list.some(
    (t) =>
      t.id !== task.id &&
      t.title === task.title &&
      t.recurrence === task.recurrence &&
      t.due_date === due &&
      t.status !== "done",
  );
