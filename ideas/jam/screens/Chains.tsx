"use client";

import { useEffect, useState } from "react";
import type { Chain, ChainStep, Member } from "../types";
import { fetchChainSteps, patch, remove, save } from "../db";
import { Empty, Modal, jField, jGhost, jPrimary } from "../ui";
import { KINDS } from "./request-core";

/** محرّر خطوات سلسلة واحدة — يُركَّب عند اختيار السلسلة فيُحمّل خطواتها */
function StepEditor({
  chain,
  members,
  onClose,
}: {
  chain: Chain;
  members: Member[];
  onClose: () => void;
}) {
  const [steps, setSteps] = useState<ChainStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChainSteps(chain.id)
      .then((s) => alive && setSteps(s))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "تعذّر التحميل"));
    return () => {
      alive = false;
    };
  }, [chain.id]);

  const reload = async () => {
    try {
      setSteps(await fetchChainSteps(chain.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحميل");
    }
  };

  const guard = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const list = steps ?? [];

  /**
   * الرقم من أعلى موجودٍ لا من طول القائمة: لو حُذفت خطوة وسطى
   * صار الطول أقلّ من أعلى رقم، فيصطدم الجديد بقيد التفرّد.
   */
  const addStep = (approver_id: string) =>
    void guard(async () => {
      const top = list.reduce((max, s) => Math.max(max, s.step_order), 0);
      await save("jam_chain_steps", {
        chain_id: chain.id,
        step_order: top + 1,
        approver_id,
        label: null,
      });
    });

  /**
   * النقل يبدّل رقمي الخطوتين لا يُعيد ترقيم الكلّ،
   * فالطلبات الجارية التي تشير إلى رقم خطوة تبقى على معناها.
   *
   * و(chain_id, step_order) قيدٌ فريد، فكتابة رقم الثانية على
   * الأولى مباشرةً تصطدم به ويفشل التبديل كلّه. فتُركن الأولى
   * في رقمٍ سالب لا يشغله أحد، ثم يُكمل التبديل.
   */
  const move = (i: number, dir: -1 | 1) => {
    const a = list[i];
    const b = list[i + dir];
    if (!a || !b) return;
    void guard(async () => {
      await patch("jam_chain_steps", a.id, { step_order: -a.step_order - 1 });
      await patch("jam_chain_steps", b.id, { step_order: a.step_order });
      await patch("jam_chain_steps", a.id, { step_order: b.step_order });
    });
  };

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  return (
    <Modal open wide onClose={onClose} title={"خطوات: " + chain.name}>
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      {steps === null ? (
        <p className="py-6 text-center text-xs text-j-faint">جارٍ التحميل…</p>
      ) : list.length === 0 ? (
        <Empty title="لا خطوات" hint="طلب على سلسلة بلا خطوات يُعتمد تلقائيًا" />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-j-line bg-j-surface px-3 py-2.5"
            >
              <span className="mark grid size-7 shrink-0 place-items-center rounded-full bg-j-brand/10 text-[11px] font-bold text-j-brand">
                {i + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{nameOf(s.approver_id)}</span>
                <input
                  className="mt-0.5 w-full bg-transparent text-[11px] text-j-faint outline-none"
                  value={s.label ?? ""}
                  placeholder="وصف الخطوة"
                  onChange={(e) =>
                    setSteps(list.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))
                  }
                  onBlur={(e) =>
                    void guard(() =>
                      patch("jam_chain_steps", s.id, { label: e.target.value || null }),
                    )
                  }
                />
              </span>

              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="shrink-0 px-1.5 text-j-dim disabled:opacity-25"
                title="أعلى"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                className="shrink-0 px-1.5 text-j-dim disabled:opacity-25"
                title="أسفل"
              >
                ↓
              </button>
              <button
                onClick={() => void guard(() => remove("jam_chain_steps", s.id))}
                className="shrink-0 px-1 text-j-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-j-dim">أضف معتمِدًا في نهاية السلسلة</span>
        <select
          className={jField}
          value=""
          onChange={(e) => {
            if (e.target.value) addStep(e.target.value);
          }}
        >
          <option value="">— اختر عضوًا —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
    </Modal>
  );
}

export function Chains({
  chains,
  members,
  onChanged,
}: {
  chains: Chain[];
  members: Member[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Chain> | null>(null);
  const [steps, setSteps] = useState<Chain | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!draft?.name?.trim()) return;
    setError(null);
    try {
      await save("jam_chains", {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        purpose: draft.purpose ?? "general",
        is_active: draft.is_active ?? true,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-j-dim">
          السلسلة ترتيب المعتمِدين لنوع من الطلبات. الطلب يمرّ عليهم واحدًا بعد واحد.
        </p>
        <button
          onClick={() => setDraft({ purpose: "general", is_active: true })}
          className={jPrimary}
        >
          + سلسلة
        </button>
      </div>

      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      {chains.length === 0 ? (
        <Empty title="لا سلاسل اعتماد" hint="بلا سلسلة يُعتمد كل طلب حين إرساله" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {chains.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  <span className="text-[11px] text-j-faint">
                    {KINDS.find((k) => k.v === c.purpose)?.label ?? c.purpose}
                  </span>
                </span>
                <button
                  onClick={async () => {
                    await patch("jam_chains", c.id, { is_active: !c.is_active });
                    onChanged();
                  }}
                  className={"shrink-0 text-[11px] " + (c.is_active ? "text-j-ok" : "text-j-faint")}
                >
                  {c.is_active ? "مفعّلة" : "معطّلة"}
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSteps(c)} className={jGhost + " flex-1 text-xs"}>
                  الخطوات
                </button>
                <button onClick={() => setDraft(c)} className={jGhost + " text-xs"}>
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {steps && (
        <StepEditor key={steps.id} chain={steps} members={members} onClose={() => setSteps(null)} />
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل سلسلة" : "سلسلة جديدة"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void submit()} className={jPrimary + " flex-1"}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  const id = draft.id;
                  if (!id) return;
                  await remove("jam_chains", id);
                  setDraft(null);
                  onChanged();
                }}
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <>
            <input
              className={jField}
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="اسم السلسلة"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">لأي نوع من الطلبات</span>
              <select
                className={jField}
                value={draft.purpose ?? "general"}
                onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
              >
                {KINDS.map((k) => (
                  <option key={k.v} value={k.v}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
              <span className="text-sm">مفعّلة</span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--j-brand)]"
                checked={draft.is_active ?? true}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
            </label>
          </>
        )}
      </Modal>
    </div>
  );
}
