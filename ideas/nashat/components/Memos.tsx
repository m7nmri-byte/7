"use client";

import { useState } from "react";
import type { Memo } from "../types";
import { field } from "@/components/styles";

/**
 * المذكّرات: ما تنوي بدءه ولم تبدأه بعد.
 * ليست مهامًا — لا وقت لها ولا حالة. مجرّد أسماء تنتظر، وضغطة
 * واحدة تحوّل إحداها إلى مهمة جارية.
 */
export function Memos({
  memos,
  hasActive,
  onAdd,
  onRemove,
  onStart,
}: {
  memos: Memo[];
  hasActive: boolean;
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onStart: (memo: Memo) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const add = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  if (!memos.length && !open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start text-xs text-n-faint transition-colors hover:text-n-accent"
      >
        + مذكّرة
      </button>
    );

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-n-line bg-n-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-n-dim">مذكّرات</h3>
        <button
          onClick={() => setOpen(!open)}
          className="text-[11px] text-n-faint transition-colors hover:text-n-text"
        >
          {open ? "إخفاء" : "إضافة"}
        </button>
      </div>

      {open && (
        <div className="flex gap-2">
          <input
            className={`${field} py-2 text-sm`}
            placeholder="ما تنوي بدءه لاحقًا"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            disabled={!text.trim()}
            className="shrink-0 rounded-xl bg-n-accent px-4 text-sm font-medium text-[#0b1419] disabled:opacity-40"
          >
            أضف
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {memos.map((m) => (
          <li key={m.id} className="group flex items-center gap-2">
            <button
              onClick={() => onStart(m)}
              title={hasActive ? "ابدأها بعد إنهاء الجارية" : "ابدأها الآن"}
              className="flex-1 truncate rounded-lg border border-n-line bg-n-bg px-3 py-2 text-start text-sm transition-colors hover:border-n-accent/40"
            >
              {m.text}
            </button>
            <button
              onClick={() => onRemove(m.id)}
              aria-label="احذف"
              className="shrink-0 px-1.5 py-1 text-n-faint opacity-0 transition-opacity hover:text-[#e0776a] group-hover:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
