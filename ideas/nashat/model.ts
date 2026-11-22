import type { SegStatus, Segment, Task } from "./types";
import { dayBounds, dayOf, todayStr } from "./time";

/* ===================== اشتقاقات أساسية ===================== */

export const lastSegment = (t: Task): Segment => t.segments[t.segments.length - 1];

export function activeTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === "active")
    .sort(
      (a, b) =>
        +new Date(lastSegment(a).start) - +new Date(lastSegment(b).start),
    );
}

/** مجموع زمن المهمة عبر كل جلساتها، والجارية تُحسب حتى اللحظة */
export function taskTotalMs(t: Task, now = Date.now()): number {
  return t.segments.reduce((sum, s) => {
    const end = s.end ? +new Date(s.end) : now;
    return sum + (end - +new Date(s.start));
  }, 0);
}

/**
 * حالة جلسة بعينها، مستقلّة عن اليوم المعروض:
 *   ongoing     — ما زالت مفتوحة
 *   done        — آخر جلسة في مهمة أُنهيت
 *   interrupted — ما عدا ذلك
 */
export function segmentStatus(t: Task, idx: number): SegStatus {
  const seg = t.segments[idx];
  if (!seg.end) return "ongoing";
  if (idx < t.segments.length - 1) return "interrupted";
  return t.status === "completed" ? "done" : "interrupted";
}

/** المهام المعلّقة التي لم تُصرف، أحدثها أولاً */
export function pendingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === "interrupted" && !t.dismissed)
    .sort((a, b) => +new Date(lastSegment(b).end!) - +new Date(lastSegment(a).end!));
}

/** كل يوم فيه أثر، مرتّباً — ويُضاف اليوم الحالي دائماً */
export function allDays(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) {
    for (const s of t.segments) {
      // جلسة تعبر منتصف الليل تخصّ اليومين معاً
      for (const d of spannedDays(s)) set.add(d);
    }
    for (const s of t.steps) set.add(s.day);
  }
  set.add(todayStr());
  return [...set].sort();
}

/**
 * الأيام التي تمسّها جلسة واحدة.
 * الأصل كان يعتمد على seg.day وحده، فتضيع ساعات الجلسة التي تمتد بعد
 * منتصف الليل من يوم الغد. هنا تُنسب إلى كل يوم تمرّ به.
 */
export function spannedDays(seg: Segment, now = Date.now()): string[] {
  const a = new Date(seg.start);
  const bMs = seg.end ? +new Date(seg.end) : now;
  const days: string[] = [];
  const cursor = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  while (cursor.getTime() < bMs) {
    days.push(dayOf(cursor.toISOString()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days.length ? days : [seg.day];
}

/* ===================== مقاطع اليوم ===================== */

export type DaySeg = {
  task: Task;
  idx: number;
  status: SegStatus;
  /** محصورة داخل حدود اليوم */
  a: number;
  b: number;
};

/** كل جلسة تمسّ هذا اليوم، مقصوصة على حدوده، مرتّبة زمنياً */
export function daySegs(tasks: Task[], day: string, now = Date.now()): DaySeg[] {
  const [d0, d1] = dayBounds(day);
  const out: DaySeg[] = [];
  for (const t of tasks) {
    t.segments.forEach((seg, idx) => {
      const a = Math.max(+new Date(seg.start), d0);
      const b = Math.min(seg.end ? +new Date(seg.end) : now, d1);
      if (b <= a) return;
      out.push({ task: t, idx, status: segmentStatus(t, idx), a, b });
    });
  }
  return out.sort((x, y) => x.a - y.a);
}

/** صفوف الخط الزمني: الجلسات المغلقة فقط — الجارية تظهر في بطاقة «الآن» */
export type TimelineRow = DaySeg & {
  seg: Segment;
  isFirstSeg: boolean;
  hasNext: boolean;
  steps: { text: string; i: number }[];
};

export function timelineRows(tasks: Task[], day: string): TimelineRow[] {
  const rows: TimelineRow[] = daySegs(tasks, day)
    .filter((r) => r.status !== "ongoing")
    .map((r) => ({
      ...r,
      seg: r.task.segments[r.idx],
      isFirstSeg: r.idx === 0,
      hasNext: r.idx < r.task.segments.length - 1,
      steps: [],
    }));

  // خطوات اليوم تُعلّق على آخر صفّ لمهمتها في هذا اليوم
  for (const t of tasks) {
    const steps = t.steps
      .map((s, i) => ({ text: s.text, i, day: s.day }))
      .filter((s) => s.day === day);
    if (!steps.length) continue;
    const mine = rows.filter((r) => r.task.id === t.id);
    if (mine.length) mine[mine.length - 1].steps = steps;
  }
  return rows;
}

/* ===================== إحصاء ===================== */

/** دمج الفترات المتداخلة — حتى لا يُحسب العمل المتوازي مرتين */
export function unionMs(list: { a: number; b: number }[]): number {
  const iv = list.map((s) => [s.a, s.b] as [number, number]).sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cs: number | null = null;
  let ce = 0;
  for (const [a, b] of iv) {
    if (cs === null) {
      cs = a;
      ce = b;
    } else if (a <= ce) {
      ce = Math.max(ce, b);
    } else {
      total += ce - cs;
      cs = a;
      ce = b;
    }
  }
  if (cs !== null) total += ce - cs;
  return total;
}

export type DayStats = {
  totalMs: number;
  completed: number;
  interruptedEvents: number;
  pending: number;
};

export function dayStats(tasks: Task[], day: string): DayStats {
  const segs = daySegs(tasks, day);
  return {
    totalMs: unionMs(segs),
    completed: segs.filter((s) => s.status === "done").length,
    interruptedEvents: segs.filter((s) => s.status === "interrupted").length,
    pending: pendingTasks(tasks).length,
  };
}
