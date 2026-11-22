import type { State, Task } from "./types";
import { activeTasks, dayStats, lastSegment, pendingTasks, timelineRows } from "./model";
import { arDate, fmtDur, fmtPeriod, fmtTime, nowISO } from "./time";

/** تنزيل ملف من المتصفح */
export function download(filename: string, data: string, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- JSON ---------- */

export function jsonAll(s: State) {
  return JSON.stringify({ exportedAt: nowISO(), tasks: s.tasks, memo: s.memo }, null, 2);
}

export function jsonDay(s: State, day: string) {
  const byTask = new Map<string, Partial<Task> & { id: string }>();
  const put = (t: Task) => {
    if (!byTask.has(t.id))
      byTask.set(t.id, {
        id: t.id,
        name: t.name,
        status: t.status,
        category: t.category,
        segments: [],
        steps: [],
      });
    return byTask.get(t.id)!;
  };

  for (const row of timelineRows(s.tasks, day)) {
    const entry = put(row.task);
    entry.segments!.push(row.seg);
    entry.steps!.push(...row.steps.map((x) => ({ text: x.text, day })));
  }
  for (const t of activeTasks(s.tasks)) {
    if (lastSegment(t).day !== day) continue;
    const entry = put(t);
    entry.segments!.push(lastSegment(t));
    entry.steps!.push(...t.steps.filter((x) => x.day === day));
  }

  return JSON.stringify({ date: day, tasks: [...byTask.values()] }, null, 2);
}

/* ---------- CSV ---------- */

const csvCell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;

export function csvDay(s: State, day: string) {
  const rows: unknown[][] = [
    ["المهمة", "الحالة", "من", "إلى", "المدة (دقائق)", "الخطوات الفرعية"],
  ];

  for (const r of timelineRows(s.tasks, day)) {
    rows.push([
      r.task.name,
      r.status === "done" ? "أُنجزت" : "قوطعت",
      `${fmtTime(r.seg.start)} ${fmtPeriod(r.seg.start)}`,
      r.seg.end ? `${fmtTime(r.seg.end)} ${fmtPeriod(r.seg.end)}` : "—",
      Math.round((r.b - r.a) / 60000),
      r.steps.map((x) => x.text).join(" | "),
    ]);
  }

  for (const t of activeTasks(s.tasks)) {
    const seg = lastSegment(t);
    if (seg.day !== day) continue;
    rows.push([
      t.name,
      "جارية الآن",
      `${fmtTime(seg.start)} ${fmtPeriod(seg.start)}`,
      "—",
      Math.round((Date.now() - +new Date(seg.start)) / 60000),
      t.steps.filter((x) => x.day === day).map((x) => x.text).join(" | "),
    ]);
  }

  // علامة الترتيب تجعل Excel يقرأ العربية صحيحة
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/* ---------- تقرير نصّي ---------- */

export function txtDay(s: State, day: string) {
  const rows = timelineRows(s.tasks, day);
  const stats = dayStats(s.tasks, day);

  const lines = [
    `تقرير اليوم — ${arDate(day)}`,
    "=".repeat(40),
    "",
    `إجمالي وقت العمل: ${fmtDur(stats.totalMs)}`,
    `مهام أُنجزت: ${stats.completed}    مقاطعات حدثت: ${stats.interruptedEvents}`,
    "",
  ];

  rows.forEach((r, i) => {
    const link = r.idx > 0 ? "  (استكمال لجلسة سابقة)" : "";
    lines.push(`${i + 1}. ${r.task.name} [${r.status === "done" ? "أُنجزت" : "قوطعت"}]${link}`);
    lines.push(
      `   ${fmtTime(r.seg.start)} ${fmtPeriod(r.seg.start)} ← ` +
        `${r.seg.end ? `${fmtTime(r.seg.end)} ${fmtPeriod(r.seg.end)}` : "—"}` +
        `  (${fmtDur(r.b - r.a)})`,
    );
    r.steps.forEach((x) => lines.push(`   • ${x.text}`));
    lines.push("");
  });

  for (const t of activeTasks(s.tasks)) {
    const seg = lastSegment(t);
    if (seg.day !== day) continue;
    lines.push(
      `جارية الآن: ${t.name} — بدأت هذه الجلسة ${fmtTime(seg.start)} ${fmtPeriod(seg.start)}`,
    );
  }

  const pend = pendingTasks(s.tasks);
  if (pend.length) {
    lines.push("", "مهام معلّقة (بانتظار الاستئناف):");
    pend.forEach((t) => lines.push(`   - ${t.name} (معلّقة منذ ${arDate(lastSegment(t).day)})`));
  }

  return lines.join("\n");
}

/* ---------- الموزّع ---------- */

export function runExport(
  kind: "txt" | "csv" | "jsonDay" | "jsonAll",
  state: State,
  day: string,
) {
  if (kind === "jsonAll")
    return download("نشاط-نسخة-كاملة.json", jsonAll(state), "application/json");
  if (kind === "jsonDay")
    return download(`نشاط-${day}.json`, jsonDay(state, day), "application/json");
  if (kind === "csv") return download(`نشاط-${day}.csv`, csvDay(state, day), "text/csv");
  return download(`تقرير-${day}.txt`, txtDay(state, day), "text/plain");
}
