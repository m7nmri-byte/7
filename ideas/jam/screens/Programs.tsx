"use client";

import { useMemo, useState } from "react";
import type { Aid, Department, Member, Program } from "../types";
import { PROGRAM_STATUS } from "../types";
import { remove, save } from "../db";
import { fmtDate, money } from "../format";
import { Empty, Modal, Tag, jField, jGhost, jPrimary, jOption } from "../ui";
import { FileField } from "../FileField";

const TONE: Record<string, string> = {
  planned: "var(--j-faint)",
  running: "var(--j-ok)",
  paused: "var(--j-warn)",
  done: "var(--j-info)",
  cancelled: "var(--j-danger)",
};

export function Programs({
  programs,
  aids,
  members,
  departments,
  onChanged,
}: {
  programs: Program[];
  aids: Aid[];
  members: Member[];
  departments: Department[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Program> | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** المصروف الفعلي من المساعدات، لا من عمود يُحدَّث يدويًا */
  const spent = useMemo(() => {
    const m = new Map<string, { amount: number; people: Set<string> }>();
    for (const a of aids) {
      if (!a.program_id || a.status !== "disbursed") continue;
      const cur = m.get(a.program_id) ?? { amount: 0, people: new Set<string>() };
      cur.amount += Number(a.amount);
      cur.people.add(a.beneficiary_id);
      m.set(a.program_id, cur);
    }
    return m;
  }, [aids]);

  const submit = async () => {
    if (!draft?.name?.trim()) return;
    setError(null);
    try {
      await save("jam_programs", {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        summary: draft.summary ?? null,
        department_id: draft.department_id ?? null,
        owner_id: draft.owner_id ?? null,
        status: draft.status ?? "planned",
        start_date: draft.start_date || null,
        end_date: draft.end_date || null,
        budget: Number(draft.budget ?? 0),
        target_beneficiaries: Number(draft.target_beneficiaries ?? 0),
        cover_url: draft.cover_url ?? null,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setDraft({ status: "planned" })} className={jPrimary}>
          + برنامج
        </button>
      </div>

      {programs.length === 0 ? (
        <Empty title="لا برامج" hint="البرنامج يجمع المساعدات تحت هدف واحد" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {programs.map((p) => {
            const s = spent.get(p.id);
            const used = s?.amount ?? 0;
            const pct = p.budget > 0 ? Math.min(100, Math.round((used / p.budget) * 100)) : 0;
            const people = s?.people.size ?? 0;
            return (
              <button
                key={p.id}
                onClick={() => setDraft(p)}
                className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
              >
                {p.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_url}
                    alt=""
                    className="-mx-4 -mt-4 h-28 w-[calc(100%+2rem)] object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{p.name}</span>
                  <Tag tone={TONE[p.status]}>{PROGRAM_STATUS[p.status]}</Tag>
                </div>

                {p.summary && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-j-dim">{p.summary}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-j-dim">
                      {money(used)} من {money(p.budget)}
                    </span>
                    <span className="mark text-j-faint">{pct}٪</span>
                  </div>
                  <span className="h-1.5 overflow-hidden rounded-full bg-j-raised">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: pct + "%",
                        backgroundColor: pct > 90 ? "var(--j-danger)" : "var(--j-brand)",
                      }}
                    />
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-j-faint">
                  <span>
                    {people} مستفيد
                    {p.target_beneficiaries > 0 ? " من " + p.target_beneficiaries : ""}
                  </span>
                  <span>
                    {p.start_date ? fmtDate(p.start_date) : "—"}
                    {p.end_date ? " ← " + fmtDate(p.end_date) : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل برنامج" : "برنامج جديد"}
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
                  await remove("jam_programs", id);
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
            {error && (
              <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
            )}

            <input
              className={jField}
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="اسم البرنامج"
            />

            <textarea
              className={jField + " min-h-20 resize-none"}
              value={draft.summary ?? ""}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value || null })}
              placeholder="وصف مختصر"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">الميزانية</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.budget ?? ""}
                  onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المستفيدون المستهدفون</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.target_beneficiaries ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, target_beneficiaries: Number(e.target.value) || 0 })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">البداية</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.start_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, start_date: e.target.value || null })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">النهاية</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.end_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المسؤول</span>
                <select
                  className={jField}
                  value={draft.owner_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, owner_id: e.target.value || null })}
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
                <span className="text-xs text-j-dim">الإدارة</span>
                <select
                  className={jField}
                  value={draft.department_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, department_id: e.target.value || null })}
                >
                  <option value="">— بلا إدارة —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <FileField
              label="صورة البرنامج"
              folder="jam/programs"
              value={draft.cover_url ?? null}
              onChange={(f) => setDraft({ ...draft, cover_url: f ? f.url : null })}
            />

            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(PROGRAM_STATUS) as (keyof typeof PROGRAM_STATUS)[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft({ ...draft, status: s })}
                  className={
                    jOption(draft.status === s) + " py-2 text-[11px]"
                  }
                >
                  {PROGRAM_STATUS[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
