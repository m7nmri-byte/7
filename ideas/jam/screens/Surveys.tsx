"use client";

import { useState } from "react";
import type { Member, Survey } from "../types";
import { patch } from "../db";
import { fmtDate } from "../format";
import { Empty, jGhost, jPrimary } from "../ui";
import { SurveyEditor } from "./SurveyEditor";
import { SurveyFill } from "./SurveyFill";
import { SurveyResults } from "./SurveyResults";

export function Surveys({
  surveys,
  members,
  me,
  onChanged,
}: {
  surveys: Survey[];
  members: Member[];
  me: string | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Survey> | null>(null);
  const [fill, setFill] = useState<Survey | null>(null);
  const [results, setResults] = useState<Survey | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-j-dim">
          استبيان داخلي: رضا الفريق، أثر برنامج، أو رأي في قرار.
        </p>
        <button
          onClick={() => setDraft({ is_open: true, questions: [] })}
          className={jPrimary}
        >
          + استبيان
        </button>
      </div>

      {surveys.length === 0 ? (
        <Empty title="لا استبيانات" hint="اسأل، ثم اقرأ التفريغ" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {surveys.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{s.title}</span>
                  <span className="mark text-[11px] text-j-faint">
                    {s.questions.length} سؤالًا · {fmtDate(s.created_at)}
                  </span>
                </span>
                <button
                  onClick={async () => {
                    await patch("jam_surveys", s.id, { is_open: !s.is_open });
                    onChanged();
                  }}
                  className={"shrink-0 text-[11px] " + (s.is_open ? "text-j-ok" : "text-j-faint")}
                >
                  {s.is_open ? "مفتوح" : "مغلق"}
                </button>
              </div>

              {s.intro && (
                <p className="line-clamp-2 text-xs leading-relaxed text-j-dim">{s.intro}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setFill(s)}
                  disabled={!s.is_open || s.questions.length === 0}
                  className={jPrimary + " flex-1 py-2 text-xs disabled:opacity-40"}
                >
                  أجِب
                </button>
                <button
                  onClick={() => setResults(s)}
                  className={jGhost + " flex-1 py-2 text-xs"}
                >
                  النتائج
                </button>
                <button onClick={() => setDraft(s)} className={jGhost + " py-2 text-xs"}>
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <SurveyEditor
          key={draft.id ?? "new"}
          draft={draft}
          me={me}
          onClose={() => setDraft(null)}
          onSaved={onChanged}
        />
      )}

      {fill && (
        <SurveyFill
          key={fill.id}
          survey={fill}
          me={me}
          onClose={() => setFill(null)}
          onSaved={onChanged}
        />
      )}

      {results && (
        <SurveyResults
          key={results.id}
          survey={results}
          members={members}
          onClose={() => setResults(null)}
        />
      )}
    </div>
  );
}
