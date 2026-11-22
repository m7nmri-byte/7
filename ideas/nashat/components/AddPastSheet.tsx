"use client";

import { useState } from "react";
import type { Category } from "../types";
import { nowISO } from "../time";
import { fromLocal, minutesBetween, shiftMinutes, toLocal } from "./datetime";
import { CategoryPicker } from "./NowCard";
import { Field, Sheet, btnPrimary, field } from "./ui";

export function AddPastSheet({
  prevEnd,
  nextStart,
  onClose,
  onAdd,
}: {
  prevEnd: string | null;
  nextStart: string | null;
  onClose: () => void;
  onAdd: (name: string, start: string, end: string, category: Category) => void;
}) {
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Category>("work");
  const [start, setStart] = useState(() => toLocal(prevEnd ?? nowISO()));
  const [end, setEnd] = useState(() => toLocal(nextStart ?? nowISO()));

  const durationMin = start && end ? minutesBetween(fromLocal(start), fromLocal(end)) : 0;
  const valid =
    Boolean(name.trim()) && Boolean(start) && Boolean(end) && durationMin > 0;

  return (
    <Sheet
      open
      onClose={onClose}
      title="إضافة مهمة"
      desc="تُسجَّل مباشرة كمهمة مكتملة، بدون المرور بمؤقّت حيّ."
    >
      <input
        className={field}
        placeholder="اسم المهمة"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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

      <button
        disabled={!valid}
        onClick={() => {
          onAdd(name, fromLocal(start), fromLocal(end), cat);
          onClose();
        }}
        className={`${btnPrimary} w-full`}
      >
        إضافة كمهمة مكتملة
      </button>
    </Sheet>
  );
}
