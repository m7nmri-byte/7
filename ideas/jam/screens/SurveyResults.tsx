"use client";

import { useEffect, useMemo, useState } from "react";
import type { Member, Survey, SurveyResponse } from "../types";
import { fetchResponses } from "../db";
import { fmtDate } from "../format";
import { Empty, Modal, jGhost } from "../ui";

/** تفريغ سؤال واحد: تكرارات للمغلق، ونصوص للمفتوح */
function Breakdown({
  question,
  responses,
}: {
  question: Survey["questions"][number];
  responses: SurveyResponse[];
}) {
  const answers = responses.map((r) => r.answers[question.id]).filter((a) => a !== undefined);
  const answered = answers.filter(
    (a) => a !== null && a !== "" && !(Array.isArray(a) && a.length === 0),
  );

  if (question.kind === "text" || question.kind === "long") {
    const texts = answered.filter((a): a is string => typeof a === "string");
    return (
      <div className="flex flex-col gap-1.5">
        {texts.length === 0 ? (
          <span className="text-[11px] text-j-faint">لا إجابات</span>
        ) : (
          texts.map((t, i) => (
            <p
              key={i}
              className="whitespace-pre-wrap rounded-lg bg-j-raised px-3 py-2 text-xs leading-relaxed"
            >
              {t}
            </p>
          ))
        )}
      </div>
    );
  }

  /** المتعدّد يُفرد كل خيار، فمجموع النسب قد يتجاوز المئة */
  const counts = new Map<string, number>();
  for (const a of answered) {
    const keys =
      Array.isArray(a) ? a.map(String) : [typeof a === "boolean" ? (a ? "نعم" : "لا") : String(a)];
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const order =
    question.kind === "scale"
      ? ["1", "2", "3", "4", "5"]
      : question.kind === "yesno"
        ? ["نعم", "لا"]
        : (question.options ?? [...counts.keys()]);

  const total = answered.length || 1;
  const average =
    question.kind === "scale"
      ? answered.reduce<number>((sum, a) => sum + (typeof a === "number" ? a : 0), 0) / total
      : null;

  return (
    <div className="flex flex-col gap-2">
      {average !== null && (
        <span className="mark text-xs text-j-brand">المتوسّط {average.toFixed(2)}</span>
      )}
      {order.map((o) => {
        const n = counts.get(o) ?? 0;
        const pct = Math.round((n / total) * 100);
        return (
          <div key={o} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-j-dim">{o}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-j-raised">
              <span
                className="block h-full rounded-full bg-j-brand"
                style={{ width: pct + "%" }}
              />
            </span>
            <span className="mark w-14 shrink-0 text-end text-[11px] text-j-faint">
              {n} · {pct}٪
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SurveyResults({
  survey,
  members,
  onClose,
}: {
  survey: Survey;
  members: Member[];
  onClose: () => void;
}) {
  const [rows, setRows] = useState<SurveyResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchResponses(survey.id)
      .then((r) => alive && setRows(r))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "تعذّر التحميل"));
    return () => {
      alive = false;
    };
  }, [survey.id]);

  const responses = rows ?? [];

  const nameOf = (r: SurveyResponse) =>
    r.member_id
      ? (members.find((m) => m.id === r.member_id)?.name ?? "عضو")
      : (r.respondent ?? "بلا اسم");

  const csv = useMemo(() => {
    const head = ["التاريخ", "المجيب", ...survey.questions.map((q) => q.label)];
    const body = responses.map((r) => [
      r.created_at.slice(0, 10),
      nameOf(r),
      ...survey.questions.map((q) => {
        const a = r.answers[q.id];
        if (a === null || a === undefined) return "";
        if (Array.isArray(a)) return a.join(" | ");
        if (typeof a === "boolean") return a ? "نعم" : "لا";
        return String(a);
      }),
    ]);
    return [head, ...body]
      .map((line) => line.map((c) => '"' + c.replace(/"/g, '""') + '"').join(","))
      .join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, survey.questions, members]);

  const download = () => {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survey-" + survey.id.slice(0, 8) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={"نتائج: " + survey.title}
      footer={
        <div className="flex gap-2">
          <button onClick={() => setRaw((v) => !v)} className={jGhost + " flex-1"}>
            {raw ? "التفريغ" : "الإجابات واحدة واحدة"}
          </button>
          <button onClick={download} className={jGhost} disabled={responses.length === 0}>
            تصدير
          </button>
        </div>
      }
    >
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      {rows === null ? (
        <p className="py-6 text-center text-xs text-j-faint">جارٍ التحميل…</p>
      ) : responses.length === 0 ? (
        <Empty title="لا إجابات بعد" />
      ) : raw ? (
        <div className="flex flex-col gap-3">
          {responses.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-j-line p-3">
              <span className="flex items-baseline justify-between">
                <span className="text-xs font-semibold">{nameOf(r)}</span>
                <span className="mark text-[10px] text-j-faint">{fmtDate(r.created_at)}</span>
              </span>
              {survey.questions.map((q) => {
                const a = r.answers[q.id];
                const text =
                  a === null || a === undefined
                    ? "—"
                    : Array.isArray(a)
                      ? a.join("، ")
                      : typeof a === "boolean"
                        ? a
                          ? "نعم"
                          : "لا"
                        : String(a);
                return (
                  <span key={q.id} className="flex gap-2 text-[11px]">
                    <span className="w-32 shrink-0 truncate text-j-faint">{q.label}</span>
                    <span className="flex-1 whitespace-pre-wrap">{text}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mark text-xs text-j-dim">{responses.length} إجابة</p>
          {survey.questions.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-2 border-t border-j-line pt-3">
              <span className="text-xs font-semibold">
                {i + 1}. {q.label}
              </span>
              <Breakdown question={q} responses={responses} />
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}
