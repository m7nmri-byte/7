"use client";

import { useMemo, useState } from "react";
import type { Indicator, Objective, Perspective } from "../types";
import { remove, save } from "../db";
import { Empty, Modal, jField, jGhost, jOption, jPrimary } from "../ui";
import {
  FREQUENCY_LABEL,
  buildTree,
  nextIndicatorCode,
  nextObjectiveCode,
} from "./strategy-core";

/** المنظورات الخمسة المعتادة في خطط الجمعيات، تُقترح ولا تُفرض */
const SUGGESTED: { name: string; prefix: string }[] = [
  { name: "المستفيدون", prefix: "س" },
  { name: "الشركاء والمجتمع", prefix: "ش" },
  { name: "العمليات الداخلية", prefix: "ع" },
  { name: "التعلّم والنمو", prefix: "ت" },
  { name: "الموارد المالية", prefix: "م" },
];

export function Strategy({
  perspectives,
  objectives,
  indicators,
  onChanged,
}: {
  perspectives: Perspective[];
  objectives: Objective[];
  indicators: Indicator[];
  onChanged: () => void;
}) {
  const [pDraft, setPDraft] = useState<Partial<Perspective> | null>(null);
  const [oDraft, setODraft] = useState<Partial<Objective> | null>(null);
  const [iDraft, setIDraft] = useState<Partial<Indicator> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const tree = useMemo(
    () => buildTree(perspectives, objectives, indicators),
    [perspectives, objectives, indicators],
  );

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const addSuggested = () =>
    void guard(async () => {
      const taken = new Set(perspectives.map((p) => p.prefix));
      let order = perspectives.length;
      for (const s of SUGGESTED) {
        if (taken.has(s.prefix)) continue;
        await save("jam_perspectives", { ...s, sort_order: order++ });
      }
    });

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-48 flex-1 text-xs leading-relaxed text-j-dim">
          المنظور يجمع أهدافًا، والهدف يُقاس بمؤشّرات. والرموز تُولَّد تلقائيًا
          على نسق الوثيقة: «س 1» للهدف، و«س 1 - 1» لمؤشّره.
        </p>
        {perspectives.length === 0 && (
          <button onClick={addSuggested} className={jGhost + " text-xs"}>
            ابدأ بالمنظورات المعتادة
          </button>
        )}
        <button
          onClick={() => setPDraft({ sort_order: perspectives.length })}
          className={jPrimary}
        >
          + منظور
        </button>
      </div>

      {tree.length === 0 ? (
        <Empty title="لا خطة بعد" hint="المنظورات أعمدة الخطة، ومنها تتفرّع الأهداف" />
      ) : (
        <div className="flex flex-col gap-3">
          {tree.map(({ perspective, objectives: objs }) => {
            const shut = open !== null && open !== perspective.id;
            return (
              <section
                key={perspective.id}
                className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm"
              >
                <div className="flex items-center gap-3 border-b border-j-line px-4 py-3">
                  <span className="mark grid size-8 shrink-0 place-items-center rounded-lg bg-j-brand/10 text-sm font-bold text-j-brand">
                    {perspective.prefix}
                  </span>
                  <button
                    onClick={() => setOpen(shut || open === null ? perspective.id : null)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <span className="block truncate text-sm font-semibold">{perspective.name}</span>
                    <span className="mark block text-[11px] text-j-faint">
                      {objs.length} هدفًا ·{" "}
                      {objs.reduce((n, o) => n + o.indicators.length, 0)} مؤشّرًا
                    </span>
                  </button>
                  <button
                    onClick={() => setPDraft(perspective)}
                    className="shrink-0 text-[11px] text-j-dim"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() =>
                      setODraft({
                        perspective_id: perspective.id,
                        code: nextObjectiveCode(
                          perspective.prefix,
                          objs.map((x) => x.objective),
                        ),
                        sort_order: objs.length,
                      })
                    }
                    className="shrink-0 text-[11px] text-j-brand"
                  >
                    + هدف
                  </button>
                </div>

                {objs.length === 0 ? (
                  <p className="px-4 py-5 text-center text-[11px] text-j-faint">لا أهداف</p>
                ) : (
                  objs.map(({ objective, indicators: inds }) => (
                    <div key={objective.id} className="border-b border-j-line/60 last:border-0">
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <span className="mark shrink-0 rounded bg-j-raised px-1.5 py-0.5 text-[10px] text-j-dim">
                          {objective.code}
                        </span>
                        <button
                          onClick={() => setODraft(objective)}
                          className="min-w-0 flex-1 truncate text-start text-xs font-medium"
                        >
                          {objective.name}
                        </button>
                        <button
                          onClick={() =>
                            setIDraft({
                              objective_id: objective.id,
                              code: nextIndicatorCode(objective.code, inds),
                              frequency: "quarterly",
                              polarity: "up",
                              cumulative: false,
                              sort_order: inds.length,
                            })
                          }
                          className="shrink-0 text-[11px] text-j-brand"
                        >
                          + مؤشّر
                        </button>
                      </div>

                      {inds.map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() => setIDraft(ind)}
                          className="flex w-full items-center gap-2 px-4 py-2 ps-10 text-start hover:bg-j-raised"
                        >
                          <span className="mark shrink-0 text-[10px] text-j-faint">{ind.code}</span>
                          <span className="min-w-0 flex-1 truncate text-[11px]">{ind.name}</span>
                          <span className="shrink-0 text-[10px] text-j-faint">
                            {ind.unit ?? "—"} · {FREQUENCY_LABEL[ind.frequency] ?? ind.frequency}
                            {ind.cumulative ? " · تراكمي" : ""}
                            {ind.polarity === "down" ? " · يقلّ" : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(pDraft)}
        onClose={() => setPDraft(null)}
        title={pDraft?.id ? "تعديل منظور" : "منظور جديد"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!pDraft?.name?.trim() || !pDraft.prefix?.trim()) return;
                  await save("jam_perspectives", {
                    ...(pDraft.id ? { id: pDraft.id } : {}),
                    name: pDraft.name.trim(),
                    prefix: pDraft.prefix.trim(),
                    sort_order: Number(pDraft.sort_order ?? 0),
                  });
                  setPDraft(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {pDraft?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = pDraft.id;
                    if (!id) return;
                    await remove("jam_perspectives", id);
                    setPDraft(null);
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
        {pDraft && (
          <>
            <input
              className={jField}
              value={pDraft.name ?? ""}
              onChange={(e) => setPDraft({ ...pDraft, name: e.target.value })}
              placeholder="اسم المنظور"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">البادئة — حرفٌ تُبنى عليه رموز الأهداف</span>
              <input
                className={jField + " w-24 text-center"}
                maxLength={3}
                value={pDraft.prefix ?? ""}
                onChange={(e) => setPDraft({ ...pDraft, prefix: e.target.value })}
                placeholder="س"
              />
            </label>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(oDraft)}
        onClose={() => setODraft(null)}
        title={oDraft?.id ? "تعديل هدف" : "هدف جديد"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!oDraft?.name?.trim()) return;
                  await save("jam_objectives", {
                    ...(oDraft.id ? { id: oDraft.id } : {}),
                    perspective_id: oDraft.perspective_id,
                    code: (oDraft.code ?? "").trim(),
                    name: oDraft.name.trim(),
                    description: oDraft.description ?? null,
                    sort_order: Number(oDraft.sort_order ?? 0),
                  });
                  setODraft(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {oDraft?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = oDraft.id;
                    if (!id) return;
                    await remove("jam_objectives", id);
                    setODraft(null);
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
        {oDraft && (
          <>
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">الرمز</span>
                <input
                  className={jField + " mark text-center"}
                  value={oDraft.code ?? ""}
                  onChange={(e) => setODraft({ ...oDraft, code: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">الهدف</span>
                <input
                  className={jField}
                  value={oDraft.name ?? ""}
                  onChange={(e) => setODraft({ ...oDraft, name: e.target.value })}
                />
              </label>
            </div>
            <textarea
              className={jField + " min-h-28 resize-none leading-relaxed"}
              value={oDraft.description ?? ""}
              onChange={(e) => setODraft({ ...oDraft, description: e.target.value || null })}
              placeholder="شرح الهدف كما في دليل الأهداف"
            />
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(iDraft)}
        wide
        onClose={() => setIDraft(null)}
        title={iDraft?.id ? "تعديل مؤشّر" : "مؤشّر جديد"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() =>
                void guard(async () => {
                  if (!iDraft?.name?.trim()) return;
                  await save("jam_indicators", {
                    ...(iDraft.id ? { id: iDraft.id } : {}),
                    objective_id: iDraft.objective_id,
                    code: (iDraft.code ?? "").trim(),
                    name: iDraft.name.trim(),
                    description: iDraft.description ?? null,
                    unit: iDraft.unit ?? null,
                    formula: iDraft.formula ?? null,
                    frequency: iDraft.frequency ?? "quarterly",
                    polarity: iDraft.polarity ?? "up",
                    cumulative: Boolean(iDraft.cumulative),
                    owner: iDraft.owner ?? null,
                    exec_owner: iDraft.exec_owner ?? null,
                    measure_owner: iDraft.measure_owner ?? null,
                    baseline:
                      iDraft.baseline === null || iDraft.baseline === undefined
                        ? null
                        : Number(iDraft.baseline),
                    sort_order: Number(iDraft.sort_order ?? 0),
                  });
                  setIDraft(null);
                })
              }
              className={jPrimary + " flex-1"}
            >
              حفظ
            </button>
            {iDraft?.id && (
              <button
                onClick={() =>
                  void guard(async () => {
                    const id = iDraft.id;
                    if (!id) return;
                    await remove("jam_indicators", id);
                    setIDraft(null);
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
        {iDraft && (
          <>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">الرمز</span>
                <input
                  className={jField + " mark text-center"}
                  value={iDraft.code ?? ""}
                  onChange={(e) => setIDraft({ ...iDraft, code: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المؤشّر</span>
                <input
                  className={jField}
                  value={iDraft.name ?? ""}
                  onChange={(e) => setIDraft({ ...iDraft, name: e.target.value })}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">وحدة القياس</span>
                <input
                  className={jField}
                  value={iDraft.unit ?? ""}
                  onChange={(e) => setIDraft({ ...iDraft, unit: e.target.value || null })}
                  placeholder="مستفيد، نسبة، ريال…"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">خط الأساس</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={iDraft.baseline ?? ""}
                  onChange={(e) =>
                    setIDraft({
                      ...iDraft,
                      baseline: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="قيمته قبل الخطة"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">معادلة الاحتساب</span>
              <input
                className={jField}
                value={iDraft.formula ?? ""}
                onChange={(e) => setIDraft({ ...iDraft, formula: e.target.value || null })}
                placeholder="كيف يُحسب — ليُقاس بالطريقة نفسها كل مرّة"
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">دورية القياس</span>
              <div className="grid grid-cols-3 gap-2">
                {(["quarterly", "semi", "yearly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setIDraft({ ...iDraft, frequency: f })}
                    className={jOption(iDraft.frequency === f) + " py-2 text-[11px]"}
                  >
                    {FREQUENCY_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">اتجاه التحسّن</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIDraft({ ...iDraft, polarity: "up" })}
                  className={jOption((iDraft.polarity ?? "up") === "up") + " py-2 text-[11px]"}
                >
                  كلّما زاد كان أفضل
                </button>
                <button
                  onClick={() => setIDraft({ ...iDraft, polarity: "down" })}
                  className={jOption(iDraft.polarity === "down") + " py-2 text-[11px]"}
                >
                  كلّما قلّ كان أفضل
                </button>
              </div>
            </div>

            {/* التراكمية تغيّر حساب المتحقق السنوي، فيُشرح أثرها لا اسمها */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">كيف يُحسب المتحقق السنوي؟</span>
              <button
                onClick={() => setIDraft({ ...iDraft, cumulative: false })}
                className={jOption(!iDraft.cumulative) + " flex-col items-start gap-0.5 py-2.5"}
              >
                <span className="text-[11px] font-semibold">مجموع الأرباع</span>
                <span className="text-[10px] font-normal opacity-80">
                  المؤشّر يبدأ من الصفر كل ربع — كعدد المستفيدين الجدد
                </span>
              </button>
              <button
                onClick={() => setIDraft({ ...iDraft, cumulative: true })}
                className={
                  jOption(Boolean(iDraft.cumulative)) + " flex-col items-start gap-0.5 py-2.5"
                }
              >
                <span className="text-[11px] font-semibold">آخر ربعٍ له قياس</span>
                <span className="text-[10px] font-normal opacity-80">
                  القيمة مستوًى قائم يحتوي آخرُها ما قبله — كنسبة الرضا. وجمعها يُخرج ٣٤٠٪
                </span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["owner", "المالك"],
                  ["exec_owner", "المنفّذ"],
                  ["measure_owner", "القائس"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-xs text-j-dim">{label}</span>
                  <input
                    className={jField}
                    value={iDraft[key] ?? ""}
                    onChange={(e) => setIDraft({ ...iDraft, [key]: e.target.value || null })}
                  />
                </label>
              ))}
            </div>

            <textarea
              className={jField + " min-h-20 resize-none"}
              value={iDraft.description ?? ""}
              onChange={(e) => setIDraft({ ...iDraft, description: e.target.value || null })}
              placeholder="وصف المؤشّر"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
