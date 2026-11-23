"use client";

import { useCallback, useMemo, useState } from "react";
import type { Initiative, Member, Objective, Plan } from "../types";
import { PRIORITY_LABEL } from "../types";
import { fetchInitiatives, remove, save } from "../db";
import { money } from "../format";
import { useLive } from "../hooks";
import { Empty, Loading, Modal, Stat, jField, jGhost, jPrimary } from "../ui";
import { planMonths, sumValues, weeksBetween } from "./strategy-core";
import { InitiativeSheet } from "./InitiativeSheet";

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Intl.DateTimeFormat("ar-SA", { month: "short", year: "2-digit" }).format(
    new Date(Number(y), Number(m) - 1, 1),
  );
};

export function Operational({
  plans,
  objectives,
  members,
  onChanged,
}: {
  plans: Plan[];
  objectives: Objective[];
  members: Member[];
  onChanged: () => void;
}) {
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [planDraft, setPlanDraft] = useState<Partial<Plan> | null>(null);
  const [draft, setDraft] = useState<Partial<Initiative> | null>(null);
  const [open, setOpen] = useState<Initiative | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId) ?? plans[0] ?? null;

  const load = useCallback(
    () => (plan ? fetchInitiatives(plan.id) : Promise.resolve([] as Initiative[])),
    [plan],
  );
  const { data, loading, refresh } = useLive("jam_initiatives", load);
  const list = useMemo<Initiative[]>(() => data ?? [], [data]);

  const months = useMemo(
    () => (plan ? planMonths(plan.start_date, plan.end_date) : []),
    [plan],
  );

  const totals = useMemo(() => {
    const budget = list.reduce((s, i) => s + Number(i.budget), 0);
    const byMonth = new Map<string, number>();
    for (const i of list)
      for (const [m, v] of Object.entries(i.monthly_budget ?? {}))
        byMonth.set(m, (byMonth.get(m) ?? 0) + (Number(v) || 0));
    return { budget, byMonth };
  }, [list]);

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      refresh();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const nextNumber = list.reduce((max, i) => Math.max(max, i.number), 0) + 1;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {plans.length > 0 && (
          <select
            className={jField + " w-auto"}
            value={plan?.id ?? ""}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setPlanDraft({})}
          className={jGhost + " text-xs"}
        >
          + خطة
        </button>
        <span className="flex-1" />
        {plan && (
          <button
            onClick={() =>
              setDraft({
                plan_id: plan.id,
                number: nextNumber,
                budget: 0,
                monthly_budget: {},
              })
            }
            className={jPrimary}
          >
            + مبادرة
          </button>
        )}
      </div>

      {!plan ? (
        <Empty title="لا خطة تشغيلية" hint="الخطة مدّة لها بداية ونهاية، وفيها مبادرات" />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="المبادرات" value={list.length} />
            <Stat label="الموازنة" value={money(totals.budget)} tone="var(--j-brand)" />
            <Stat label="الأسابيع" value={plan.week_count} />
            <Stat
              label="الموزّع على الأشهر"
              value={money([...totals.byMonth.values()].reduce((a, b) => a + b, 0))}
            />
          </div>

          {list.length === 0 ? (
            <Empty title="لا مبادرات" hint="المبادرة تحوّل الهدف إلى خطوات بمواعيد وتكلفة" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm">
              {list.map((i, n) => {
                const obj = objectives.find((o) => o.id === i.objective_id);
                const spread = sumValues(i.monthly_budget);
                const mismatch = Math.abs(spread - Number(i.budget)) > 0.5 && spread > 0;
                return (
                  <button
                    key={i.id}
                    onClick={() => setOpen(i)}
                    className={
                      "flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-j-raised " +
                      (n > 0 ? "border-t border-j-line" : "")
                    }
                  >
                    <span className="mark grid size-7 shrink-0 place-items-center rounded-lg bg-j-raised text-[11px] font-bold">
                      {i.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{i.name}</span>
                      <span className="block truncate text-[11px] text-j-faint">
                        {obj ? obj.code + " · " + obj.name : "بلا هدف"}
                        {i.duration_text ? " · " + i.duration_text : ""}
                      </span>
                    </span>
                    {i.priority && (
                      <span className="shrink-0 text-[10px] text-j-dim">
                        {PRIORITY_LABEL[i.priority] ?? i.priority}
                      </span>
                    )}
                    <span className="mark shrink-0 text-xs font-semibold">
                      {money(Number(i.budget))}
                    </span>
                    {/* توزيعٌ لا يطابق الموازنة يُقال، فالفرق يُكتشف متأخرًا */}
                    {mismatch && (
                      <span className="shrink-0 text-[10px] text-j-warn" title="التوزيع الشهري لا يطابق الموازنة">
                        ≠
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {months.length > 0 && totals.byMonth.size > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
              <span className="text-xs text-j-dim">الموازنة على أشهر الخطة</span>
              <div className="flex items-end gap-2 overflow-x-auto pb-1">
                {months.map((m) => {
                  const v = totals.byMonth.get(m) ?? 0;
                  const peak = Math.max(1, ...totals.byMonth.values());
                  return (
                    <div key={m} className="flex shrink-0 flex-col items-center gap-1.5">
                      <span className="mark text-[9px] text-j-faint">
                        {v > 0 ? Math.round(v / 1000) + "k" : ""}
                      </span>
                      <span
                        className="w-7 rounded-t bg-j-brand/70"
                        style={{ height: Math.max(2, (v / peak) * 72) + "px" }}
                      />
                      <span className="text-[9px] text-j-faint">{monthLabel(m)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(planDraft)}
        onClose={() => setPlanDraft(null)}
        title={planDraft?.id ? "تعديل خطة" : "خطة تشغيلية"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!planDraft?.label?.trim() || !planDraft.start_date || !planDraft.end_date)
                    return;
                  await save("jam_plans", {
                    ...(planDraft.id ? { id: planDraft.id } : {}),
                    label: planDraft.label.trim(),
                    start_date: planDraft.start_date,
                    end_date: planDraft.end_date,
                    /** عدد الأسابيع يُشتقّ من المدى فلا يُدخل يدويًا ويتناقض معه */
                    week_count: weeksBetween(planDraft.start_date, planDraft.end_date),
                  });
                  setPlanDraft(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {planDraft?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = planDraft.id;
                    if (!id) return;
                    await remove("jam_plans", id);
                    setPlanDraft(null);
                    setPlanId(null);
                  })
                }
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {planDraft && (
          <>
            <input
              className={jField}
              value={planDraft.label ?? ""}
              onChange={(e) => setPlanDraft({ ...planDraft, label: e.target.value })}
              placeholder="مثل: خطة ٢٠٢٦"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">البداية</span>
                <input
                  type="date"
                  className={jField}
                  value={planDraft.start_date ?? ""}
                  onChange={(e) => setPlanDraft({ ...planDraft, start_date: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">النهاية</span>
                <input
                  type="date"
                  className={jField}
                  value={planDraft.end_date ?? ""}
                  onChange={(e) => setPlanDraft({ ...planDraft, end_date: e.target.value })}
                />
              </label>
            </div>
            {planDraft.start_date && planDraft.end_date && (
              <p className="mark text-xs text-j-dim">
                {weeksBetween(planDraft.start_date, planDraft.end_date)} أسبوعًا ·{" "}
                {planMonths(planDraft.start_date, planDraft.end_date).length} شهرًا
              </p>
            )}
          </>
        )}
      </Modal>

      {draft && (
        <InitiativeSheet
          key={draft.id ?? "new"}
          draft={draft}
          plan={plan}
          objectives={objectives}
          members={members}
          onClose={() => setDraft(null)}
          onSaved={() => {
            refresh();
            onChanged();
          }}
        />
      )}

      {open && (
        <InitiativeSheet
          key={open.id}
          draft={open}
          plan={plan}
          objectives={objectives}
          members={members}
          onClose={() => setOpen(null)}
          onSaved={() => {
            refresh();
            onChanged();
          }}
        />
      )}
    </div>
  );
}
