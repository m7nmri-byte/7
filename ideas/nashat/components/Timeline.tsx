"use client";

import { useState } from "react";
import type { SegStatus, Task } from "../types";
import type { TimelineRow } from "../model";
import { lastSegment, taskTotalMs } from "../model";
import { ageText } from "../arabic";
import { fmtDur, fmtPeriod, fmtTime } from "../time";
import { useNow } from "./ui";

const STATUS_COLOR: Record<SegStatus, string> = {
  done: "var(--st-ripe)",
  interrupted: "var(--st-building)",
  ongoing: "var(--brand)",
};

export function StatusGlyph({ status, size = 16 }: { status: SegStatus; size?: number }) {
  const color = STATUS_COLOR[status];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="8" cy="8" r="6.6" opacity={0.45} />
      {status === "done" ? (
        <path d="m5 8.2 2.2 2.2L11 6.4" />
      ) : status === "interrupted" ? (
        <path d="M8 4.6v4M8 11.2v.2" />
      ) : (
        <circle cx="8" cy="8" r="2.4" fill={color} stroke="none" />
      )}
    </svg>
  );
}

/* ---------- صفّ إدراج مهمة ماضية بين جلستين ---------- */

function InsertRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 py-1 text-[11px] text-faint transition-colors hover:text-brand"
    >
      <span className="h-px flex-1 bg-edge transition-colors group-hover:bg-brand/40" />
      <span className="rounded-full border border-edge px-2 py-0.5 transition-colors group-hover:border-brand/40">
        + إضافة هنا
      </span>
      <span className="h-px flex-1 bg-edge transition-colors group-hover:bg-brand/40" />
    </button>
  );
}

/* ---------- الخط الزمني ---------- */

export function Timeline({
  rows,
  onEdit,
  onInsert,
  onRemoveStep,
}: {
  rows: TimelineRow[];
  onEdit: (taskId: string, segIdx: number) => void;
  onInsert: (prevEnd: string | null, nextStart: string | null) => void;
  onRemoveStep: (taskId: string, stepIndex: number) => void;
}) {
  // الأحدث أولاً
  const ordered = [...rows].reverse();

  if (!ordered.length) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-2xl border border-dashed border-edge py-10 text-center text-sm text-muted">
          لا توجد مهام مسجّلة في هذا اليوم
        </p>
        <InsertRow onClick={() => onInsert(null, null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <InsertRow
        onClick={() => onInsert(ordered[0].seg.end, null)}
      />
      {ordered.map((row, i) => {
        const next = ordered[i + 1];
        const ms = row.b - row.a;
        return (
          <div key={`${row.task.id}:${row.idx}`}>
            <div className="flex gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-card">
              <StatusGlyph status={row.status} size={18} />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onEdit(row.task.id, row.idx)}
                    className="truncate text-start text-[15px] transition-colors hover:text-brand"
                  >
                    {row.task.name}
                    {!row.isFirstSeg && (
                      <span className="ms-2 text-[10px] text-faint">استكمال</span>
                    )}
                  </button>
                  <span className="mark shrink-0 text-sm tabular-nums text-muted">
                    {fmtDur(ms)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
                  <span>
                    {fmtTime(row.seg.start)} {fmtPeriod(row.seg.start)}
                  </span>
                  <span>←</span>
                  <span>
                    {row.seg.end ? `${fmtTime(row.seg.end)} ${fmtPeriod(row.seg.end)}` : "—"}
                  </span>
                </div>

                {row.steps.length > 0 && (
                  <ul className="flex flex-col gap-1 border-s-2 border-edge ps-3 text-xs text-muted">
                    {row.steps.map((s) => (
                      <li key={s.i} className="group/step flex items-center gap-2">
                        <span className="flex-1">• {s.text}</span>
                        <button
                          onClick={() => onRemoveStep(row.task.id, s.i)}
                          aria-label="حذف الخطوة"
                          className="opacity-0 transition-opacity hover:text-[#e08a7a] group-hover/step:opacity-100"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <InsertRow
              onClick={() => onInsert(next ? next.seg.end : null, row.seg.start)}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- المهام المعلّقة ---------- */

export function PendingStack({
  tasks,
  onResume,
  onDismiss,
}: {
  tasks: Task[];
  onResume: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const now = useNow(60_000);
  const [open, setOpen] = useState(false);
  if (!tasks.length) return null;

  const shown = open ? tasks : tasks.slice(0, 2);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-edge bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">
          معلّقة ({tasks.length})
        </h3>
        {tasks.length > 2 && (
          <button
            onClick={() => setOpen(!open)}
            className="text-[11px] text-faint transition-colors hover:text-ink"
          >
            {open ? "إخفاء" : "عرض الكل"}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-1.5">
        {shown.map((t) => {
          const age = (now - +new Date(lastSegment(t).end!)) / 3_600_000;
          return (
            <li key={t.id} className="flex items-center gap-2">
              <button
                onClick={() => onResume(t.id)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-edge bg-paper px-3 py-2 text-start transition-colors hover:border-brand/40"
              >
                <span className="truncate text-[15px]">{t.name}</span>
                <span className="mark shrink-0 text-[11px] text-faint">
                  {ageText(age)} · {fmtDur(taskTotalMs(t, now))}
                </span>
              </button>
              <button
                onClick={() => onDismiss(t.id)}
                aria-label="صرف"
                title="أزلها من المعلّقة"
                className="rounded-lg px-2 py-2 text-faint transition-colors hover:text-ink"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
