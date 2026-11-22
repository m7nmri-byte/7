"use client";

import { useState } from "react";
import type { Category, Task } from "../types";
import { fromLocal, minutesBetween, shiftMinutes, toLocal } from "./datetime";
import { CategoryPicker } from "./NowCard";
import { Field, Sheet, btnDanger, btnGhost, btnPrimary, field } from "./ui";

export type EditPatch = {
  name: string;
  start: string;
  end: string | null;
  category: Category;
};

export function EditSheet({
  task,
  segIdx,
  onClose,
  onSave,
  onDeleteSegment,
  onDeleteTask,
  onSetStatus,
}: {
  task: Task;
  segIdx: number;
  onClose: () => void;
  onSave: (patch: EditPatch) => void;
  onDeleteSegment: () => void;
  onDeleteTask: () => void;
  onSetStatus: (s: "completed" | "interrupted") => void;
}) {
  const seg = task.segments[segIdx];
  const [name, setName] = useState(task.name);
  const [cat, setCat] = useState<Category>(task.category);
  const [start, setStart] = useState(() => toLocal(seg.start));
  const [end, setEnd] = useState(() => (seg.end ? toLocal(seg.end) : ""));

  const closed = seg.end !== null;
  const durationMin = closed && end ? minutesBetween(fromLocal(start), fromLocal(end)) : 0;

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="تعديل المهمة"
      desc={`الجلسة ${segIdx + 1} من ${task.segments.length}`}
    >
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
      <CategoryPicker value={cat} onChange={setCat} />

      <Field label="البداية">
        <input
          type="datetime-local"
          step={1}
          className={`${field} mark`}
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>

      {closed && (
        <>
          <Field label="النهاية">
            <input
              type="datetime-local"
              step={1}
              className={`${field} mark`}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
          <Field label="أو المدة (دقيقة)">
            <input
              type="number"
              min={1}
              className={`${field} mark`}
              value={durationMin || ""}
              onChange={(e) =>
                setEnd(toLocal(shiftMinutes(fromLocal(start), Number(e.target.value) || 0)))
              }
            />
          </Field>
        </>
      )}

      <button
        onClick={act(() =>
          onSave({
            name,
            start: fromLocal(start),
            end: closed && end ? fromLocal(end) : null,
            category: cat,
          }),
        )}
        className={`${btnPrimary} w-full`}
      >
        حفظ
      </button>

      <div className="mt-2 flex flex-col gap-2 border-t border-edge pt-3">
        {task.status !== "completed" && (
          <button onClick={act(() => onSetStatus("completed"))} className={btnGhost}>
            علّمها مُنجزة
          </button>
        )}
        {task.status !== "interrupted" && (
          <button onClick={act(() => onSetStatus("interrupted"))} className={btnGhost}>
            علّمها معلّقة
          </button>
        )}
        <button onClick={act(onDeleteSegment)} className={btnDanger}>
          حذف هذه الجلسة
        </button>
        {task.segments.length > 1 && (
          <button onClick={act(onDeleteTask)} className={btnDanger}>
            حذف المهمة وكل جلساتها
          </button>
        )}
      </div>
    </Sheet>
  );
}
