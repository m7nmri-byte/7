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
