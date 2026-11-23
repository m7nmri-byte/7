"use client";

import { useState } from "react";
import type { Question, QuestionKind, Survey } from "../types";
import { QUESTION_KIND } from "../types";
import { remove, save } from "../db";
import { Modal, jField, jGhost, jPrimary } from "../ui";

const NEEDS_OPTIONS = (k: QuestionKind) => k === "choice" || k === "multi";

const newId = () => Math.random().toString(36).slice(2, 9);

/** يُركَّب عند الفتح ويُفكَّك عند الإغلاق */
export function SurveyEditor({
  draft,
  me,
  onClose,
  onSaved,
}: {
  draft: Partial<Survey>;
  me: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [row, setRow] = useState<Partial<Survey>>(draft);
  const [error, setError] = useState<string | null>(null);

  const questions = row.questions ?? [];

  const setQ = (id: string, p: Partial<Question>) =>
    setRow({
      ...row,
      questions: questions.map((q) => (q.id === id ? { ...q, ...p } : q)),
    });

  const addQ = () =>
    setRow({
      ...row,
      questions: [...questions, { id: newId(), kind: "text", label: "", required: false }],
    });

  const move = (i: number, dir: -1 | 1) => {
    const next = [...questions];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setRow({ ...row, questions: next });
  };

  const submit = async () => {
    if (!row.title?.trim()) return;
    setError(null);
    try {
      await save("jam_surveys", {
        ...(row.id ? { id: row.id } : {}),
        title: row.title.trim(),
        intro: row.intro ?? null,
        is_open: row.is_open ?? true,
        /** الأسئلة تُحفظ مرتّبة كما ظهرت، فالترتيب جزء من المعنى */
        questions: questions.filter((q) => q.label.trim()),
        created_by: row.created_by ?? me,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={row.id ? "تعديل استبيان" : "استبيان جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void submit()} className={jPrimary + " flex-1"}>
            حفظ
          </button>
          {row.id && (
            <button
              onClick={async () => {
                const id = row.id;
                if (!id) return;
                await remove("jam_surveys", id);
                onSaved();
                onClose();
              }}
              className={jGhost}
            >
              حذف
            </button>
          )}
        </div>
      }
    >
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <input
        className={jField}
        value={row.title ?? ""}
        onChange={(e) => setRow({ ...row, title: e.target.value })}
        placeholder="عنوان الاستبيان"
      />

      <textarea
        className={jField + " min-h-20 resize-none"}
        value={row.intro ?? ""}
        onChange={(e) => setRow({ ...row, intro: e.target.value || null })}
        placeholder="مقدّمة تُقرأ قبل الإجابة"
      />

      <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
        <span className="flex flex-col">
          <span className="text-sm">مفتوح للإجابة</span>
          <span className="text-[11px] text-j-faint">إغلاقه يمنع إجابات جديدة</span>
        </span>
        <input
          type="checkbox"
          className="size-4 accent-[var(--j-brand)]"
          checked={row.is_open ?? true}
          onChange={(e) => setRow({ ...row, is_open: e.target.checked })}
        />
      </label>

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-j-dim">الأسئلة ({questions.length})</span>
        <button onClick={addQ} className="text-[11px] text-j-brand">
          + سؤال
        </button>
      </div>

      {questions.map((q, i) => (
        <div
          key={q.id}
          className="flex flex-col gap-2.5 rounded-xl border border-j-line bg-j-raised/50 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="mark grid size-6 shrink-0 place-items-center rounded-full bg-j-brand/10 text-[10px] font-bold text-j-brand">
              {i + 1}
            </span>
            <input
              className={jField + " flex-1 py-2"}
              value={q.label}
              onChange={(e) => setQ(q.id, { label: e.target.value })}
              placeholder="نصّ السؤال"
            />
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="shrink-0 px-1 text-j-dim disabled:opacity-25"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === questions.length - 1}
              className="shrink-0 px-1 text-j-dim disabled:opacity-25"
            >
              ↓
            </button>
            <button
              onClick={() => setRow({ ...row, questions: questions.filter((x) => x.id !== q.id) })}
              className="shrink-0 px-1 text-j-danger"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className={jField + " w-auto py-1.5 text-xs"}
              value={q.kind}
              onChange={(e) =>
                setQ(q.id, {
                  kind: e.target.value as QuestionKind,
                  /** تغيير النوع يُسقط خيارات لم تعد تُستعمل */
                  options: NEEDS_OPTIONS(e.target.value as QuestionKind)
                    ? (q.options ?? ["", ""])
                    : undefined,
                })
              }
            >
              {(Object.keys(QUESTION_KIND) as QuestionKind[]).map((k) => (
                <option key={k} value={k}>
                  {QUESTION_KIND[k]}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-j-dim">
              <input
                type="checkbox"
                className="size-3.5 accent-[var(--j-brand)]"
                checked={q.required}
                onChange={(e) => setQ(q.id, { required: e.target.checked })}
              />
              إلزامي
            </label>
          </div>

          {NEEDS_OPTIONS(q.kind) && (
            <div className="flex flex-col gap-1.5">
              {(q.options ?? []).map((o, oi) => (
                <div key={oi} className="flex gap-2">
                  <input
                    className={jField + " flex-1 py-1.5 text-xs"}
                    value={o}
                    onChange={(e) =>
                      setQ(q.id, {
                        options: (q.options ?? []).map((x, xi) => (xi === oi ? e.target.value : x)),
                      })
                    }
                    placeholder={"خيار " + (oi + 1)}
                  />
                  <button
                    onClick={() =>
                      setQ(q.id, { options: (q.options ?? []).filter((_, xi) => xi !== oi) })
                    }
                    className="shrink-0 px-1 text-xs text-j-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setQ(q.id, { options: [...(q.options ?? []), ""] })}
                className="self-start text-[11px] text-j-brand"
              >
                + خيار
              </button>
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
}
