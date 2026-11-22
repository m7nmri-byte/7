import { MAX_PARALLEL, type Category, type State, type Task, type TaskStatus } from "./types";
import { activeTasks, lastSegment } from "./model";
import { dayOf, nowISO, todayStr, uid } from "./time";

/**
 * كل دالة هنا خالصة: تأخذ الحالة وتُعيد حالة جديدة.
 * الأصل كان يعدّل مصفوفة عامة ويقرأ من الـ DOM داخل منطق الأعمال —
 * فكان يصعب اختباره وتتسرّب إليه أعطال التوقيت. هنا المنطق معزول،
 * وكل ما يحتاجه يصله وسيطاً.
 */

const replace = (tasks: Task[], id: string, fn: (t: Task) => Task): Task[] =>
  tasks.map((t) => (t.id === id ? fn(t) : t));

export function newTask(
  name: string,
  startIso: string,
  category: Category = "work",
): Task {
  return {
    id: uid(),
    name: name.trim(),
    status: "active",
    category,
    segments: [{ start: startIso, end: null, day: dayOf(startIso) }],
    steps: [],
  };
}

/** بدء مهمة، مع إمكان تأريخها إلى الوراء بدقائق */
export function startTask(
  s: State,
  name: string,
  backMinutes = 0,
  category: Category = "work",
): State {
  const start = new Date(Date.now() - Math.max(0, backMinutes) * 60000).toISOString();
  return { ...s, tasks: [...s.tasks, newTask(name, start, category)] };
}

/** بدء مهمة ثانية بالتوازي دون إغلاق الجارية */
export function startParallel(s: State, name: string, category: Category = "work"): State {
  if (activeTasks(s.tasks).length >= MAX_PARALLEL) return s;
  return { ...s, tasks: [...s.tasks, newTask(name, nowISO(), category)] };
}

/** استئناف معلّقة: جلسة جديدة تحت المهمة نفسها، فلا تُمسّ أرقام الجلسة القديمة */
export function resumeTask(s: State, id: string, parallel = false): State {
  if (parallel && activeTasks(s.tasks).length >= MAX_PARALLEL) return s;
  return {
    ...s,
    tasks: replace(s.tasks, id, (t) => ({
      ...t,
      status: "active",
      dismissed: undefined,
      segments: [...t.segments, { start: nowISO(), end: null, day: todayStr() }],
    })),
  };
}

export function addStep(s: State, taskId: string, text: string): State {
  return {
    ...s,
    tasks: replace(s.tasks, taskId, (t) => ({
      ...t,
      steps: [...t.steps, { text: text.trim(), day: todayStr() }],
    })),
  };
}

export function removeStep(s: State, taskId: string, index: number): State {
  return {
    ...s,
    tasks: replace(s.tasks, taskId, (t) => ({
      ...t,
      steps: t.steps.filter((_, i) => i !== index),
    })),
  };
}

export type Next =
  | { type: "new"; name: string; category: Category; backMinutes: number }
  | { type: "resume"; id: string }
  | { type: "stop" };

/**
 * إغلاق الجارية ثم الانتقال. قرار الإغلاق منفصل عن قرار ما بعده.
 * backMinutes في «مهمة جديدة» تؤخّر بداية الجديدة وتقدّم نهاية السابقة
 * بالقدر نفسه، فتتقلّص السابقة بدل أن تتداخل الاثنتان.
 */
export function closeAndProceed(
  s: State,
  closeStatus: Exclude<TaskStatus, "active">,
  next: Next,
  endOverride?: string,
): State {
  const current = activeTasks(s.tasks)[0] ?? null;

  let boundary = endOverride
    ? new Date(Math.min(Date.now(), +new Date(endOverride))).toISOString()
    : nowISO();

  if (next.type === "new" && next.backMinutes > 0) {
    let backMs = next.backMinutes * 60000;
    if (current) {
      // لا تتجاوز بداية الجلسة الجارية، وإلا انقلبت المدة سالبة
      const room = +new Date(boundary) - +new Date(lastSegment(current).start);
      backMs = Math.min(backMs, Math.max(0, room));
    }
    boundary = new Date(+new Date(boundary) - backMs).toISOString();
  }

  let tasks = s.tasks;
  if (current) {
    tasks = replace(tasks, current.id, (t) => ({
      ...t,
      status: closeStatus,
      segments: t.segments.map((seg, i) =>
        i === t.segments.length - 1 ? { ...seg, end: boundary } : seg,
      ),
    }));
  }

  if (next.type === "new") {
    tasks = [...tasks, newTask(next.name, boundary, next.category)];
  } else if (next.type === "resume") {
    tasks = replace(tasks, next.id, (t) => ({
      ...t,
      status: "active",
      dismissed: undefined,
      segments: [...t.segments, { start: nowISO(), end: null, day: todayStr() }],
    }));
  }

  return { ...s, tasks };
}

/** إضافة مهمة منتهية مباشرة، بلا مؤقّت حيّ */
export function addPastTask(
  s: State,
  name: string,
  startIso: string,
  endIso: string,
  category: Category = "work",
): State {
  const t = newTask(name, startIso, category);
  t.status = "completed";
  t.segments[0].end = endIso;
  return { ...s, tasks: [...s.tasks, t] };
}

/** تعديل اسم المهمة أو زمن إحدى جلساتها */
export function editSegment(
  s: State,
  taskId: string,
  segIdx: number,
  patch: { name?: string; start?: string; end?: string | null; category?: Category },
): State {
  return {
    ...s,
    tasks: replace(s.tasks, taskId, (t) => ({
      ...t,
      name: patch.name?.trim() || t.name,
      category: patch.category ?? t.category,
      segments: t.segments.map((seg, i) => {
        if (i !== segIdx) return seg;
        const start = patch.start ?? seg.start;
        const end = patch.end === undefined ? seg.end : patch.end;
        return { ...seg, start, end, day: dayOf(start) };
      }),
    })),
  };
}

export function setTaskStatus(s: State, id: string, status: TaskStatus): State {
  return {
    ...s,
    tasks: replace(s.tasks, id, (t) => ({
      ...t,
      status,
      segments:
        status === "active"
          ? t.segments
          : t.segments.map((seg, i) =>
              i === t.segments.length - 1 && !seg.end
                ? { ...seg, end: nowISO() }
                : seg,
            ),
    })),
  };
}

/** صرف مهمة معلّقة من قائمة الحلقات المفتوحة دون حذفها */
export function dismissTask(s: State, id: string): State {
  return { ...s, tasks: replace(s.tasks, id, (t) => ({ ...t, dismissed: true })) };
}

export function deleteSegment(s: State, taskId: string, segIdx: number): State {
  const tasks = s.tasks
    .map((t) => {
      if (t.id !== taskId) return t;
      const segments = t.segments.filter((_, i) => i !== segIdx);
      return segments.length ? { ...t, segments } : null;
    })
    .filter((t): t is Task => t !== null);
  return { ...s, tasks };
}

export function deleteTask(s: State, id: string): State {
  return { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
}

/** مسح يوم: تُحذف جلساته وخطواته، وتبقى المهمة إن بقي لها أثر في يوم آخر */
export function clearDay(s: State, day: string): State {
  const tasks = s.tasks
    .map((t) => {
      const segments = t.segments.filter((seg) => seg.day !== day);
      const steps = t.steps.filter((st) => st.day !== day);
      return segments.length ? { ...t, segments, steps } : null;
    })
    .filter((t): t is Task => t !== null);
  return { ...s, tasks };
}

export const clearAll = (): State => ({ tasks: [], memo: [] });

/* ---------- المذكّرات ---------- */

export const addMemo = (s: State, text: string): State => ({
  ...s,
  memo: [...s.memo, { id: uid(), text: text.trim() }],
});

export const removeMemo = (s: State, id: string): State => ({
  ...s,
  memo: s.memo.filter((m) => m.id !== id),
});
