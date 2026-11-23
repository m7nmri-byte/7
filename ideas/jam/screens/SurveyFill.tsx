"use client";

import { useState } from "react";
import type { Question, Survey } from "../types";
import { save } from "../db";
import { Modal, jField, jGhost, jPrimary } from "../ui";

type Answer = string | string[] | number | boolean | null;

/** إجابة فارغة بحسب نوع السؤال — يميّز «لم يُجب» عن «أجاب بلا» */
const blank = (q: Question): Answer => (q.kind === "multi" ? [] : null);

export function SurveyFill({
  survey,
  me,
  onClose,
  onSaved,
}: {
  survey: Survey;
  me: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(survey.questions.map((q) => [q.id, blank(q)])),
  );
  const [respondent, setRespondent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (id: string, v: Answer) => setAnswers({ ...answers, [id]: v });

  const toggleMulti = (id: string, option: string) => {
    const cur = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    set(id, cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option]);
  };

  const submit = async () => {
    const missing = survey.questions.find((q) => {
      if (!q.required) return false;
      const a = answers[q.id];
      if (a === null || a === "") return true;
      if (Array.isArray(a) && a.length === 0) return true;
      return false;
    });
    if (missing) {
      setError("سؤال إلزامي بلا إجابة: " + missing.label);
      return;
    }

    setError(null);
    try {
      await save("jam_survey_responses", {
        survey_id: survey.id,
        answers,
        member_id: me,
        respondent: respondent.trim() || null,
      });
      setDone(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الإرسال");
    }
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title={survey.title}>
        <p className="py-6 text-center text-sm text-j-ok">وصلت إجابتك، شكرًا.</p>
        <button onClick={onClose} className={jGhost + " w-full"}>
          إغلاق
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={survey.title}
      footer={
        <button onClick={() => void submit()} className={jPrimary + " w-full"}>
          أرسل
        </button>
      }
    >
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      {survey.intro && (
        <p className="whitespace-pre-wrap rounded-xl bg-j-raised px-4 py-3 text-xs leading-relaxed text-j-dim">
          {survey.intro}
        </p>
      )}

      {!me && (
        <input
          className={jField}
          value={respondent}
          onChange={(e) => setRespondent(e.target.value)}
          placeholder="اسمك (اختياري)"
        />
      )}

      {survey.questions.map((q, i) => {
        const a = answers[q.id];
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <span className="flex items-baseline gap-2 text-sm">
              <span className="mark shrink-0 text-xs text-j-faint">{i + 1}.</span>
              <span className="flex-1">
                {q.label}
                {q.required && <span className="ms-1 text-j-danger">*</span>}
              </span>
            </span>

            {q.kind === "text" && (
              <input
                className={jField}
                value={typeof a === "string" ? a : ""}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}

            {q.kind === "long" && (
              <textarea
                className={jField + " min-h-24 resize-none leading-relaxed"}
                value={typeof a === "string" ? a : ""}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}

            {q.kind === "choice" && (
              <div className="flex flex-wrap gap-2">
                {(q.options ?? []).map((o) => (
                  <button
                    key={o}
                    onClick={() => set(q.id, o)}
                    className={
                      jGhost +
                      " px-3 py-1.5 text-xs " +
                      (a === o ? "border-j-brand bg-j-brand/10 text-j-brand" : "")
                    }
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {q.kind === "multi" && (
              <div className="flex flex-wrap gap-2">
                {(q.options ?? []).map((o) => {
                  const on = Array.isArray(a) && a.includes(o);
                  return (
                    <button
                      key={o}
                      onClick={() => toggleMulti(q.id, o)}
                      className={
                        jGhost +
                        " px-3 py-1.5 text-xs " +
                        (on ? "border-j-brand bg-j-brand/10 text-j-brand" : "")
                      }
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            )}

            {q.kind === "scale" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => set(q.id, n)}
                    className={
                      "mark grid size-10 place-items-center rounded-xl border text-sm transition-colors " +
                      (a === n
                        ? "border-j-brand bg-j-brand text-white"
                        : "border-j-line bg-j-surface text-j-dim")
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {q.kind === "yesno" && (
              <div className="flex gap-2">
                {[
                  [true, "نعم"],
                  [false, "لا"],
                ].map(([v, label]) => (
                  <button
                    key={String(v)}
                    onClick={() => set(q.id, v as boolean)}
                    className={
                      jGhost +
                      " px-4 py-1.5 text-xs " +
                      (a === v ? "border-j-brand bg-j-brand/10 text-j-brand" : "")
                    }
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </Modal>
  );
}
