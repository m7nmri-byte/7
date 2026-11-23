"use client";

import { useMemo, useState } from "react";
import type { Donor, Grant, GrantStatus, Member, Program } from "../types";
import { GRANT_STATUS } from "../types";
import { remove, save } from "../db";
import { daysUntil, fmtDate, money } from "../format";
import { Empty, Modal, Stat, Tag, jField, jGhost, jPrimary, jOption } from "../ui";

const TONE: Record<GrantStatus, string> = {
  idea: "var(--j-faint)",
  submitted: "var(--j-info)",
  under_review: "var(--j-warn)",
  approved: "var(--j-ok)",
  rejected: "var(--j-danger)",
  closed: "var(--j-dim)",
};

/** مراحل المسار بالترتيب — المرفوض والمغلق خارج اللوح */
const LANES: GrantStatus[] = ["idea", "submitted", "under_review", "approved"];

export function Grants({
  grants,
  donors,
  programs,
  members,
  onChanged,
}: {
  grants: Grant[];
  donors: Donor[];
  programs: Program[];
  members: Member[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Grant> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archive, setArchive] = useState(false);

  const donorName = (id: string | null) => donors.find((d) => d.id === id)?.name ?? "—";

  const totals = useMemo(() => {
    let pipeline = 0;
    let approved = 0;
    let collected = 0;
    for (const g of grants) {
      if (g.status === "idea" || g.status === "submitted" || g.status === "under_review")
        pipeline += Number(g.requested);
      if (g.status === "approved" || g.status === "closed")
        approved += Number(g.approved_amount ?? g.requested);
      collected += Number(g.collected);
    }
    return { pipeline, approved, collected };
  }, [grants]);

  const archived = useMemo(
    () => grants.filter((g) => g.status === "rejected" || g.status === "closed"),
    [grants],
  );

  const submit = async () => {
    if (!draft?.title?.trim()) return;
    setError(null);
    try {
      await save("jam_grants", {
        ...(draft.id ? { id: draft.id } : {}),
        donor_id: draft.donor_id ?? null,
        program_id: draft.program_id ?? null,
        title: draft.title.trim(),
        requested: Number(draft.requested ?? 0),
        approved_amount:
          draft.approved_amount === null || draft.approved_amount === undefined
            ? null
            : Number(draft.approved_amount),
        collected: Number(draft.collected ?? 0),
        status: draft.status ?? "idea",
        submitted_at: draft.submitted_at || null,
        closes_at: draft.closes_at || null,
        owner_id: draft.owner_id ?? null,
        notes: draft.notes ?? null,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const card = (g: Grant) => {
    const due = g.closes_at ? daysUntil(g.closes_at) : null;
    const late = due !== null && due < 0;
    const soon = due !== null && due >= 0 && due <= 14;
    return (
      <button
        key={g.id}
        onClick={() => setDraft(g)}
        className="flex w-full flex-col gap-2 rounded-xl border border-j-line bg-j-surface p-3 text-start shadow-j-sm"
      >
        <span className="line-clamp-2 text-xs font-semibold leading-relaxed">{g.title}</span>
        <span className="truncate text-[11px] text-j-dim">{donorName(g.donor_id)}</span>
        <div className="flex items-baseline justify-between">
          <span className="mark text-xs font-semibold">
            {money(g.approved_amount ?? g.requested)}
          </span>
          {g.collected > 0 && (
            <span className="mark text-[10px] text-j-ok">حُصّل {money(g.collected)}</span>
          )}
        </div>
        {due !== null && (
          <span
            className="text-[10px]"
            style={{ color: late ? "var(--j-danger)" : soon ? "var(--j-warn)" : "var(--j-faint)" }}
          >
            {late ? "تجاوز الموعد " + -due + " يومًا" : "يُغلق بعد " + due + " يومًا"}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="قيد السعي" value={money(totals.pipeline)} />
        <Stat label="معتمد" value={money(totals.approved)} tone="var(--j-ok)" />
        <Stat label="محصّل" value={money(totals.collected)} tone="var(--j-brand)" />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setArchive((v) => !v)} className={jGhost + " text-xs"}>
          {archive ? "المسار" : "المنتهية (" + archived.length + ")"}
        </button>
        <button onClick={() => setDraft({ status: "idea" })} className={jPrimary}>
          + منحة
        </button>
      </div>

      {archive ? (
        archived.length === 0 ? (
          <Empty title="لا منح منتهية" />
        ) : (
          <div className="flex flex-col gap-2">
            {archived.map((g) => (
              <button
                key={g.id}
                onClick={() => setDraft(g)}
                className="flex items-center justify-between gap-3 rounded-xl border border-j-line bg-j-surface px-4 py-3 text-start"
              >
                <span className="truncate text-sm">{g.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mark text-xs text-j-dim">{money(g.collected)}</span>
                  <Tag tone={TONE[g.status]}>{GRANT_STATUS[g.status]}</Tag>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-3 md:grid-cols-4">
          {LANES.map((lane) => {
            const items = grants.filter((g) => g.status === lane);
            return (
              <div key={lane} className="flex flex-col gap-2 rounded-2xl bg-j-raised/60 p-3">
                <div className="flex items-baseline justify-between px-1">
                  <span className="text-xs font-semibold" style={{ color: TONE[lane] }}>
                    {GRANT_STATUS[lane]}
                  </span>
                  <span className="mark text-[10px] text-j-faint">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <span className="px-1 py-6 text-center text-[11px] text-j-faint">—</span>
                ) : (
                  items.map(card)
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل منحة" : "منحة جديدة"}
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
                  await remove("jam_grants", id);
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
              value={draft.title ?? ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="عنوان المنحة"
            />

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(GRANT_STATUS) as GrantStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      status: s,
                      /** أول انتقال إلى «مُقدَّمة» يثبّت تاريخ التقديم */
                      submitted_at:
                        s !== "idea" && !draft.submitted_at
                          ? new Date().toISOString().slice(0, 10)
                          : draft.submitted_at,
                    })
                  }
                  className={
                    jOption(draft.status === s) + " py-2 text-[11px]"
                  }
                >
                  {GRANT_STATUS[s]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المطلوب</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.requested ?? ""}
                  onChange={(e) => setDraft({ ...draft, requested: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المعتمد</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.approved_amount ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      approved_amount: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المحصّل</span>
                <input
                  type="number"
                  className={jField + " mark"}
                  value={draft.collected ?? ""}
                  onChange={(e) => setDraft({ ...draft, collected: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">تاريخ التقديم</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.submitted_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, submitted_at: e.target.value || null })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">موعد الإغلاق</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.closes_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, closes_at: e.target.value || null })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">المانح</span>
                <select
                  className={jField}
                  value={draft.donor_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, donor_id: e.target.value || null })}
                >
                  <option value="">— غير محدّد —</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">البرنامج</span>
                <select
                  className={jField}
                  value={draft.program_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, program_id: e.target.value || null })}
                >
                  <option value="">— بلا برنامج —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
            </div>

            <textarea
              className={jField + " min-h-20 resize-none"}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
              placeholder="ملاحظات"
            />

            {draft.submitted_at && (
              <p className="text-[11px] text-j-faint">قُدِّمت في {fmtDate(draft.submitted_at)}</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
