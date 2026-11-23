"use client";

import { useState } from "react";
import type { Category, Task } from "../types";
import type { Next } from "../actions";
import { lastSegment } from "../model";
import { fmtPeriod, fmtTime, nowISO } from "../time";
import { BackMinutes, CategoryPicker } from "./NowCard";
import { fromLocal, minutesBetween, shiftMinutes, toLocal } from "./datetime";
import { Field, Sheet, btnGhost, btnPrimary, field } from "./ui";

export function NextSheet({
  title,
  current,
  pending,
  presetName,
  onClose,
  onProceed,
}: {
  title: string;
  current: Task | null;
  pending: Task[];
  /** اسم مبدئي يُملأ تلقائيًا — يأتي من مذكّرة */
  presetName?: string;
  onClose: () => void;
  onProceed: (next: Next, endOverride?: string) => void;
}) {
  const [mode, setMode] = useState<"new" | "resume">("new");
  const [name, setName] = useState(presetName ?? "");
  const [cat, setCat] = useState<Category>("work");
  const [back, setBack] = useState(0);
  // تُركَّب النافذة عند الفتح فقط، فالقيم الابتدائية تُحسب مرة واحدة
  const [end, setEnd] = useState(() => toLocal(nowISO()));

  const endIso = end ? fromLocal(end) : undefined;
  const startIso = current ? lastSegment(current).start : null;
  const durationMin = startIso && endIso ? minutesBetween(startIso, endIso) : 0;

  const proceed = (next: Next) => {
    onProceed(next, endIso);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={title} desc="اختر ماذا تريد أن تبدأ الآن">
      {current && startIso && (
        <div className="flex flex-col gap-2 border-b border-dashed border-n-line pb-4">
          <Field label="انتهت الساعة — عدّلها إذا احتجت">
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
                setEnd(toLocal(shiftMinutes(startIso, Number(e.target.value) || 0)))
              }
            />
          </Field>
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-n-line p-1">
        {([["new", "مهمة جديدة"], ["resume", "استكمال معلّقة"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            disabled={k === "resume" && pending.length === 0}
            className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors disabled:opacity-40 ${
              mode === k ? "bg-n-accent-soft font-medium text-n-accent" : "text-n-dim hover:text-n-text"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === "new" ? (
        <>
          <input
            className={field}
            placeholder="اسم المهمة الجديدة"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim())
                proceed({ type: "new", name, category: cat, backMinutes: back });
            }}
          />
          <CategoryPicker value={cat} onChange={setCat} />
          <div className="flex items-center justify-between gap-3">
            <BackMinutes value={back} onChange={setBack} />
            <button
              disabled={!name.trim()}
              onClick={() => proceed({ type: "new", name, category: cat, backMinutes: back })}
              className={btnPrimary}
            >
              تأكيد
            </button>
          </div>
        </>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pending.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => proceed({ type: "resume", id: t.id })}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-n-line bg-n-bg px-3 py-2.5 text-start transition-colors hover:border-n-accent/40"
              >
                <span className="truncate text-sm">{t.name}</span>
                <span className="mark shrink-0 text-[11px] text-n-faint">
                  {fmtTime(lastSegment(t).end!)} {fmtPeriod(lastSegment(t).end!)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => proceed({ type: "stop" })}
        className={`${btnGhost} mt-2 w-full text-n-dim`}
      >
        توقفت عن التسجيل
      </button>
    </Sheet>
  );
}
