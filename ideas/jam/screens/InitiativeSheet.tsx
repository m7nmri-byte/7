"use client";

import { useEffect, useState } from "react";
import type { Initiative, InitiativeStep, Member, Objective, Plan } from "../types";
import { PHASE_LABEL, PRIORITY_LABEL } from "../types";
import { fetchSteps, remove, save } from "../db";
import { money } from "../format";
import { Modal, jField, jGhost, jOption, jPrimary } from "../ui";
import { initiativeProgress, planMonths, sumValues } from "./strategy-core";

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Intl.DateTimeFormat("ar-SA", { month: "short" }).format(
    new Date(Number(y), Number(m) - 1, 1),
  );
};

export function InitiativeSheet({
  draft,
  plan,
  objectives,
  members,
  onClose,
  onSaved,
}: {
  draft: Partial<Initiative>;
  plan: Plan | null;
  objectives: Objective[];
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [row, setRow] = useState<Partial<Initiative>>(draft);
  const [steps, setSteps] = useState<InitiativeStep[] | null>(draft.id ? null : []);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "steps" | "budget">("info");

  useEffect(() => {
    if (!draft.id) return;
    let alive = true;
    fetchSteps(draft.id)
      .then((s) => alive && setSteps(s))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "تعذّر التحميل"));
    return () => {
      alive = false;
    };
  }, [draft.id]);

  const list = steps ?? [];
  const months = plan ? planMonths(plan.start_date, plan.end_date) : [];
  const spread = sumValues(row.monthly_budget);
  const progress = initiativeProgress(list);

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      if (row.id) setSteps(await fetchSteps(row.id));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const submit = () =>
    void guard(async () => {
      if (!row.name?.trim() || !row.plan_id) return;
      const saved = (await save("jam_initiatives", {
        ...(row.id ? { id: row.id } : {}),
        plan_id: row.plan_id,
        number: Number(row.number ?? 1),
        name: row.name.trim(),
        description: row.description ?? null,
        objective_id: row.objective_id ?? null,
        duration_text: row.duration_text ?? null,
        manager_id: row.manager_id ?? null,
        department_id: row.department_id ?? null,
        priority: row.priority ?? null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        budget: Number(row.budget ?? 0),
        monthly_budget: row.monthly_budget ?? {},
        marketing_url: row.marketing_url ?? null,
      })) as Initiative;
      setRow(saved);
    });

  const addStep = () =>
    void guard(async () => {
      if (!row.id) {
        setError("احفظ المبادرة أولًا، ثم أضف خطواتها");
        return;
      }
      await save("jam_initiative_steps", {
        initiative_id: row.id,
        sort_order: list.length,
        title: "خطوة جديدة",
        phase: "exec",
        progress: 0,
        cost: 0,
        actual_cost: 0,
        monthly_cost: {},
      });
    });

  const patchStep = (id: string, p: Partial<InitiativeStep>) => {
    setSteps((cur) => (cur ?? []).map((s) => (s.id === id ? { ...s, ...p } : s)));
  };

  const pushStep = (s: InitiativeStep) =>
    void guard(() =>
      save("jam_initiative_steps", {
        id: s.id,
        initiative_id: s.initiative_id,
        sort_order: s.sort_order,
        phase: s.phase,
        title: s.title,
        evidence: s.evidence,
        owner_id: s.owner_id,
        cost: Number(s.cost ?? 0),
        actual_cost: Number(s.actual_cost ?? 0),
        plan_start_week: s.plan_start_week,
        plan_weeks: s.plan_weeks,
        actual_start_week: s.actual_start_week,
        actual_weeks: s.actual_weeks,
        progress: Math.min(100, Math.max(0, Number(s.progress) || 0)),
        monthly_cost: s.monthly_cost ?? {},
      }).then(() => undefined),
    );

  const TABS = [
    { k: "info" as const, t: "البيانات" },
    { k: "steps" as const, t: "الخطوات (" + list.length + ")" },
    { k: "budget" as const, t: "الموازنة" },
  ];

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={row.id ? "مبادرة " + row.number : "مبادرة جديدة"}
      footer={
        <div className="flex gap-2">
          <button onClick={submit} className={jPrimary + " flex-1"}>
            حفظ
          </button>
          {row.id && (
            <button
              onClick={() =>
                void guard(async () => {
                  const id = row.id;
                  if (!id) return;
                  await remove("jam_initiatives", id);
                  onClose();
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
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1 rounded-xl bg-j-raised p-1">
          {TABS.map((x) => (
            <button
              key={x.k}
              onClick={() => setTab(x.k)}
              className={
                "flex-1 rounded-lg px-3 py-2 text-xs transition " +
                (tab === x.k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {x.t}
            </button>
          ))}
        </div>
        <span className="mark shrink-0 text-sm font-bold text-j-brand">{progress}٪</span>
      </div>

      {tab === "info" && (
        <>
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">الرقم</span>
              <input
                type="number"
                className={jField + " mark text-center"}
                value={row.number ?? 1}
                onChange={(e) => setRow({ ...row, number: Number(e.target.value) || 1 })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">اسم المبادرة</span>
              <input
                className={jField}
                value={row.name ?? ""}
                onChange={(e) => setRow({ ...row, name: e.target.value })}
              />
            </label>
          </div>

          <textarea
            className={jField + " min-h-20 resize-none"}
            value={row.description ?? ""}
            onChange={(e) => setRow({ ...row, description: e.target.value || null })}
            placeholder="وصف المبادرة"
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">الهدف الاستراتيجي</span>
            <select
              className={jField}
              value={row.objective_id ?? ""}
              onChange={(e) => setRow({ ...row, objective_id: e.target.value || null })}
            >
              <option value="">— بلا هدف —</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">مدير المبادرة</span>
              <select
                className={jField}
                value={row.manager_id ?? ""}
                onChange={(e) => setRow({ ...row, manager_id: e.target.value || null })}
              >
                <option value="">— غير محدّد —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">المدّة</span>
              <input
                className={jField}
                value={row.duration_text ?? ""}
                onChange={(e) => setRow({ ...row, duration_text: e.target.value || null })}
                placeholder="١٨ أسبوعًا"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">البداية</span>
              <input
                type="date"
                className={jField}
                value={row.start_date ?? ""}
                onChange={(e) => setRow({ ...row, start_date: e.target.value || null })}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">النهاية</span>
              <input
                type="date"
                className={jField}
                value={row.end_date ?? ""}
                onChange={(e) => setRow({ ...row, end_date: e.target.value || null })}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-j-dim">الأولوية</span>
            <div className="grid grid-cols-3 gap-2">
              {(["high", "mid", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setRow({ ...row, priority: p })}
                  className={jOption(row.priority === p) + " py-2 text-[11px]"}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <input
            className={jField}
            dir="ltr"
            value={row.marketing_url ?? ""}
            onChange={(e) => setRow({ ...row, marketing_url: e.target.value || null })}
            placeholder="رابط الملف التسويقي"
          />
        </>
      )}

      {tab === "steps" && (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] leading-relaxed text-j-dim">
              نسبة إنجاز الخطوة هي المُدخل الوحيد، ومنها تُحسب نسبة المبادرة موزونةً
              بمدّة كل خطوة — فخطوةٌ من ثمانية أسابيع ليست كخطوةٍ من أسبوع.
            </p>
            <button onClick={addStep} className="shrink-0 text-[11px] text-j-brand">
              + خطوة
            </button>
          </div>

          {steps === null ? (
            <p className="py-4 text-center text-xs text-j-faint">جارٍ التحميل…</p>
          ) : list.length === 0 ? (
            <p className="py-4 text-center text-xs text-j-faint">لا خطوات</p>
          ) : (
            list.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border border-j-line bg-j-raised/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="mark grid size-6 shrink-0 place-items-center rounded-full bg-j-brand/10 text-[10px] font-bold text-j-brand">
                    {i + 1}
                  </span>
                  <input
                    className={jField + " flex-1 py-1.5 text-xs"}
                    value={s.title}
                    onChange={(e) => patchStep(s.id, { title: e.target.value })}
                    onBlur={() => pushStep(s)}
                  />
                  <button
                    onClick={() => void guard(() => remove("jam_initiative_steps", s.id))}
                    className="shrink-0 px-1 text-j-danger"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">المرحلة</span>
                    <select
                      className={jField + " py-1.5 text-[11px]"}
                      value={s.phase ?? "exec"}
                      onChange={(e) => patchStep(s.id, { phase: e.target.value })}
                      onBlur={() => pushStep(s)}
                    >
                      {Object.keys(PHASE_LABEL).map((k) => (
                        <option key={k} value={k}>
                          {PHASE_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">المسؤول</span>
                    <select
                      className={jField + " py-1.5 text-[11px]"}
                      value={s.owner_id ?? ""}
                      onChange={(e) => patchStep(s.id, { owner_id: e.target.value || null })}
                      onBlur={() => pushStep(s)}
                    >
                      <option value="">—</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">يبدأ أسبوع</span>
                    <input
                      type="number"
                      className={jField + " mark py-1.5 text-center text-[11px]"}
                      value={s.plan_start_week ?? ""}
                      onChange={(e) =>
                        patchStep(s.id, {
                          plan_start_week: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      onBlur={() => pushStep(s)}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">عدد الأسابيع</span>
                    <input
                      type="number"
                      className={jField + " mark py-1.5 text-center text-[11px]"}
                      value={s.plan_weeks ?? ""}
                      onChange={(e) =>
                        patchStep(s.id, {
                          plan_weeks: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      onBlur={() => pushStep(s)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">التكلفة المخطّطة</span>
                    <input
                      type="number"
                      className={jField + " mark py-1.5 text-[11px]"}
                      value={s.cost ?? 0}
                      onChange={(e) => patchStep(s.id, { cost: Number(e.target.value) || 0 })}
                      onBlur={() => pushStep(s)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">الفعلية</span>
                    <input
                      type="number"
                      className={jField + " mark py-1.5 text-[11px]"}
                      value={s.actual_cost ?? 0}
                      onChange={(e) => patchStep(s.id, { actual_cost: Number(e.target.value) || 0 })}
                      onBlur={() => pushStep(s)}
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-1 col-span-2">
                    <span className="text-[10px] text-j-faint">الإنجاز {s.progress}٪</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      className="accent-[var(--j-brand)]"
                      value={s.progress}
                      onChange={(e) => patchStep(s.id, { progress: Number(e.target.value) })}
                      onMouseUp={() => pushStep(s)}
                      onTouchEnd={() => pushStep(s)}
                    />
                  </label>
                </div>

                <input
                  className={jField + " py-1.5 text-[11px]"}
                  value={s.evidence ?? ""}
                  onChange={(e) => patchStep(s.id, { evidence: e.target.value || null })}
                  onBlur={() => pushStep(s)}
                  placeholder="شاهد التنفيذ — الوثيقة التي تُثبت إنجاز الخطوة"
                />
              </div>
            ))
          )}
        </>
      )}

      {tab === "budget" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">موازنة المبادرة</span>
            <input
              type="number"
              className={jField + " mark"}
              value={row.budget ?? 0}
              onChange={(e) => setRow({ ...row, budget: Number(e.target.value) || 0 })}
            />
          </label>

          {months.length === 0 ? (
            <p className="text-xs text-j-faint">حدّد مدى الخطة ليظهر التوزيع الشهري</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-j-dim">التوزيع على أشهر الخطة</span>
                <button
                  onClick={() => {
                    /** توزيعٌ متساوٍ، والباقي على آخر شهر فلا يضيع بالتقريب */
                    const n = months.length;
                    const total = Number(row.budget) || 0;
                    const each = Math.floor((total / n) * 100) / 100;
                    const next: Record<string, number> = {};
                    months.forEach((m, i) => {
                      next[m] = i === n - 1 ? Math.round((total - each * (n - 1)) * 100) / 100 : each;
                    });
                    setRow({ ...row, monthly_budget: next });
                  }}
                  className="text-[11px] text-j-brand"
                >
                  وزّعها بالتساوي
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {months.map((m) => (
                  <label key={m} className="flex flex-col gap-1">
                    <span className="text-[10px] text-j-faint">{monthLabel(m)}</span>
                    <input
                      type="number"
                      className={jField + " mark py-1.5 text-center text-[11px]"}
                      value={row.monthly_budget?.[m] ?? ""}
                      onChange={(e) =>
                        setRow({
                          ...row,
                          monthly_budget: {
                            ...(row.monthly_budget ?? {}),
                            [m]: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <p
                className="mark text-xs"
                style={{
                  color:
                    Math.abs(spread - Number(row.budget ?? 0)) > 0.5
                      ? "var(--j-warn)"
                      : "var(--j-dim)",
                }}
              >
                الموزّع {money(spread)} من {money(Number(row.budget ?? 0))}
                {Math.abs(spread - Number(row.budget ?? 0)) > 0.5 ? " — لا يطابق" : ""}
              </p>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
