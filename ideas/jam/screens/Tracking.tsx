"use client";

import { useCallback, useMemo, useState } from "react";
import type { Indicator, IndicatorResult, Objective, Perspective } from "../types";
import { fetchResults, saveResult } from "../db";
import { useLive } from "../hooks";
import { Empty, Loading, Stat } from "../ui";
import {
  PERIOD_LABEL,
  type Period,
  type Quarter,
  achievement,
  achievementTone,
  annualActual,
  annualTarget,
  averageAchievement,
  buildTree,
  indexResults,
  measuredQuarters,
  resultKey,
} from "./strategy-core";

const STATE_LABEL: Record<string, string> = {
  active: "يُحتسب",
  postponed: "مؤجَّل",
  no_data: "بلا بيانات",
};

const pct = (v: number | null) => (v === null ? "—" : Math.round(v) + "٪");

/** خليّة إدخال: مستهدف ومتحقق لفترة واحدة */
function Cell({
  value,
  onSave,
  dim,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
  dim?: boolean;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  return (
    <input
      className={
        "mark w-full rounded-lg border border-j-line bg-j-surface px-1.5 py-1 text-center text-[11px] outline-none focus:border-j-brand/60 " +
        (dim ? "text-j-faint" : "")
      }
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const t = text.trim();
        const next = t === "" ? null : Number(t);
        if (t !== "" && !Number.isFinite(next)) {
          setText(value === null ? "" : String(value));
          return;
        }
        if (next !== value) onSave(next);
      }}
    />
  );
}

export function Tracking({
  perspectives,
  objectives,
  indicators,
}: {
  perspectives: Perspective[];
  objectives: Objective[];
  indicators: Indicator[];
}) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => fetchResults(year), [year]);
  const { data, loading, refresh } = useLive("jam_indicator_results", load);
  const rows = useMemo<IndicatorResult[]>(() => data ?? [], [data]);
  const results = useMemo(() => indexResults(rows), [rows]);

  const tree = useMemo(
    () => buildTree(perspectives, objectives, indicators),
    [perspectives, objectives, indicators],
  );

  const overall = useMemo(
    () => averageAchievement(indicators, year, results),
    [indicators, year, results],
  );

  const put = (
    indicator: Indicator,
    period: Period,
    patch: Partial<IndicatorResult>,
  ) => {
    const cur = results.get(resultKey(indicator.id, year, period));
    setError(null);
    void saveResult({
      ...(cur?.id ? { id: cur.id } : {}),
      indicator_id: indicator.id,
      year,
      period,
      target: cur?.target ?? null,
      actual: cur?.actual ?? null,
      state: cur?.state ?? "active",
      is_override: cur?.is_override ?? false,
      note: cur?.note ?? null,
      ...patch,
    })
      .then(refresh)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "تعذّر الحفظ"),
      );
  };

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now - 2, now - 1, now, now + 1, now + 2];
  }, []);

  if (loading) return <Loading />;

  const QS: Quarter[] = ["q1", "q2", "q3", "q4"];

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={
                "mark rounded-lg px-3 py-1.5 text-xs transition " +
                (year === y ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {y}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <Stat
          label={"إنجاز " + overall.measured + " مؤشّرًا من " + overall.total}
          value={pct(overall.pct)}
          tone={achievementTone(overall.pct)}
        />
      </div>

      {tree.length === 0 && <Empty title="لا مؤشّرات" hint="ابنِ الخطة أولًا، ثم تابعها هنا" />}

      {tree.map(({ perspective, objectives: objs }) => {
        const all = objs.flatMap((o) => o.indicators);
        if (!all.length) return null;
        const avg = averageAchievement(all, year, results);

        return (
          <section
            key={perspective.id}
            className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm"
          >
            <div className="flex items-center gap-3 border-b border-j-line px-4 py-3">
              <span className="mark grid size-7 shrink-0 place-items-center rounded-lg bg-j-brand/10 text-xs font-bold text-j-brand">
                {perspective.prefix}
              </span>
              <span className="flex-1 truncate text-sm font-semibold">{perspective.name}</span>
              <span className="mark text-sm font-bold" style={{ color: achievementTone(avg.pct) }}>
                {pct(avg.pct)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-j-line text-[10px] text-j-faint">
                    <th className="px-3 py-2 text-start font-medium">المؤشّر</th>
                    <th className="px-2 py-2 font-medium">الحساب</th>
                    {QS.flatMap((q) => [
                      <th key={q + "t"} className="px-1 py-2 font-normal">
                        {PERIOD_LABEL[q].replace("الربع ", "")} · مستهدف
                      </th>,
                      <th key={q + "a"} className="px-1 py-2 font-normal">
                        متحقق
                      </th>,
                    ])}
                    <th className="px-2 py-2 font-medium">السنة</th>
                    <th className="px-2 py-2 font-medium">الإنجاز</th>
                  </tr>
                </thead>

                <tbody>
                  {objs.flatMap(({ objective, indicators: inds }) =>
                    inds.map((ind, i) => {
                      const measured = measuredQuarters(ind.frequency);
                      const act = annualActual(ind, year, results);
                      const tgt = annualTarget(ind, year, results);
                      const done = achievement(ind, act, tgt);
                      const manual = results.get(resultKey(ind.id, year, "year"));

                      return (
                        <tr key={ind.id} className="border-b border-j-line/50 last:border-0">
                          <td className="px-3 py-1.5">
                            {i === 0 && (
                              <span className="mark block text-[10px] text-j-faint">
                                {objective.code} · {objective.name}
                              </span>
                            )}
                            <span className="flex items-baseline gap-1.5">
                              <span className="mark shrink-0 text-[10px] text-j-faint">
                                {ind.code}
                              </span>
                              <span className="truncate">{ind.name}</span>
                            </span>
                          </td>

                          <td className="px-2 text-center text-[10px] text-j-faint">
                            {ind.cumulative ? "آخر ربع" : "مجموع"}
                            {ind.polarity === "down" ? " ↓" : ""}
                          </td>

                          {QS.flatMap((q) => {
                            const cur = results.get(resultKey(ind.id, year, q));
                            if (!measured.includes(q))
                              return [
                                <td key={q + "t"} className="px-1 text-center text-j-faint">
                                  —
                                </td>,
                                <td key={q + "a"} className="px-1 text-center text-j-faint">
                                  —
                                </td>,
                              ];
                            return [
                              <td key={q + "t"} className="px-1 py-1.5">
                                <Cell
                                  key={"t" + (cur?.target ?? "")}
                                  value={cur?.target ?? null}
                                  onSave={(v) => put(ind, q, { target: v })}
                                  dim
                                />
                              </td>,
                              <td key={q + "a"} className="px-1 py-1.5">
                                <Cell
                                  key={"a" + (cur?.actual ?? "")}
                                  value={cur?.actual ?? null}
                                  onSave={(v) => put(ind, q, { actual: v })}
                                />
                                <button
                                  onClick={() =>
                                    put(ind, q, {
                                      state:
                                        cur?.state === "postponed"
                                          ? "active"
                                          : cur?.state === "active" || !cur
                                            ? "no_data"
                                            : "postponed",
                                    })
                                  }
                                  title="يُحتسب / بلا بيانات / مؤجَّل"
                                  className="mt-0.5 block w-full text-center text-[9px] text-j-faint hover:text-j-dim"
                                >
                                  {STATE_LABEL[cur?.state ?? "active"]}
                                </button>
                              </td>,
                            ];
                          })}

                          <td className="px-2 text-center">
                            <span className="mark font-semibold">
                              {act === null ? "—" : Math.round(act * 100) / 100}
                            </span>
                            {manual?.is_override && (
                              <span className="block text-[9px] text-j-warn">يدوي</span>
                            )}
                          </td>

                          <td
                            className="mark px-2 text-center font-bold"
                            style={{ color: achievementTone(done) }}
                          >
                            {pct(done)}
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
