"use client";

import { useMemo, useState } from "react";
import type { Leave, LeaveType, Member } from "../types";
import { LEAVE_TYPE } from "../types";
import { patch, remove, save } from "../db";
import { fmtDate } from "../format";
import { Empty, Modal, Stat, Tag, jField, jGhost, jPrimary } from "../ui";

const TONE: Record<LeaveType, string> = {
  annual: "var(--j-brand)",
  sick: "var(--j-warn)",
  unpaid: "var(--j-faint)",
  emergency: "var(--j-danger)",
  mission: "var(--j-info)",
};

/** عدد الأيام ضمنًا للطرفين — إجازة يوم واحد تساوي يومًا لا صفرًا */
const days = (from: string, to: string) =>
  Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1);

export function Leaves({
  leaves,
  members,
  me,
  today,
  onChanged,
}: {
  leaves: Leave[];
  members: Member[];
  me: string | null;
  today: string;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Leave> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"current" | "pending" | "all">("current");

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  const onLeaveNow = useMemo(
    () => leaves.filter((l) => l.approved && l.start_date <= today && l.end_date >= today),
    [leaves, today],
  );
  const pending = useMemo(() => leaves.filter((l) => !l.approved), [leaves]);

  const shown = useMemo(() => {
    if (scope === "pending") return pending;
    if (scope === "current") return leaves.filter((l) => l.end_date >= today);
    return leaves;
  }, [leaves, pending, scope, today]);

  /** رصيد السنوية المستهلك هذا العام لكل عضو */
  const usedAnnual = useMemo(() => {
    const year = today.slice(0, 4);
    const m = new Map<string, number>();
    for (const l of leaves)
      if (l.approved && l.type === "annual" && l.start_date.startsWith(year))
        m.set(l.member_id, (m.get(l.member_id) ?? 0) + days(l.start_date, l.end_date));
    return m;
  }, [leaves, today]);

  const submit = async () => {
    if (!draft?.member_id || !draft.start_date || !draft.end_date) return;
    if (draft.end_date < draft.start_date) {
      setError("تاريخ النهاية قبل البداية");
      return;
    }
    setError(null);
    try {
      await save("jam_leaves", {
        ...(draft.id ? { id: draft.id } : {}),
        member_id: draft.member_id,
        type: draft.type ?? "annual",
        start_date: draft.start_date,
        end_date: draft.end_date,
        note: draft.note ?? null,
        approved: Boolean(draft.approved),
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="في إجازة اليوم" value={onLeaveNow.length} tone="var(--j-info)" />
        <Stat
          label="بانتظار الاعتماد"
          value={pending.length}
          tone={pending.length ? "var(--j-warn)" : undefined}
        />
        <Stat label="السجلّ" value={leaves.length} />
      </div>

      {onLeaveNow.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-j-line bg-j-surface p-4">
          {onLeaveNow.map((l) => (
            <span
              key={l.id}
              className="flex items-baseline gap-2 rounded-xl bg-j-raised px-3 py-2 text-xs"
            >
              <span className="font-medium">{name(l.member_id)}</span>
              <span style={{ color: TONE[l.type] }}>{LEAVE_TYPE[l.type]}</span>
              <span className="mark text-[10px] text-j-faint">حتى {fmtDate(l.end_date)}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {(
            [
              ["current", "الحالية والقادمة"],
              ["pending", "بانتظار الاعتماد"],
              ["all", "الكل"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setScope(k)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (scope === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button
          onClick={() =>
            setDraft({ member_id: me ?? "", type: "annual", start_date: today, end_date: today })
          }
          className={jPrimary}
        >
          + إجازة
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا إجازات" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm">
          {shown.map((l, i) => (
            <div
              key={l.id}
              className={
                "flex items-center gap-3 px-4 py-3 " + (i > 0 ? "border-t border-j-line" : "")
              }
            >
              <button onClick={() => setDraft(l)} className="min-w-0 flex-1 text-start">
                <span className="block truncate text-sm font-medium">{name(l.member_id)}</span>
                <span className="mark block text-[11px] text-j-faint">
                  {fmtDate(l.start_date)} ← {fmtDate(l.end_date)} · {days(l.start_date, l.end_date)}{" "}
                  يوم
                  {l.type === "annual" ? " · استهلك " + (usedAnnual.get(l.member_id) ?? 0) : ""}
                </span>
              </button>

              <Tag tone={TONE[l.type]}>{LEAVE_TYPE[l.type]}</Tag>

              {l.approved ? (
                <span className="shrink-0 text-[11px] text-j-ok">معتمدة</span>
              ) : (
                <button
                  onClick={async () => {
                    await patch("jam_leaves", l.id, { approved: true });
                    onChanged();
                  }}
                  className={jGhost + " shrink-0 px-3 py-1.5 text-[11px]"}
                >
                  اعتماد
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل إجازة" : "إجازة جديدة"}
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
                  await remove("jam_leaves", id);
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

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">العضو</span>
              <select
                className={jField}
                value={draft.member_id ?? ""}
                onChange={(e) => setDraft({ ...draft, member_id: e.target.value })}
              >
                <option value="">— اختر —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(LEAVE_TYPE) as LeaveType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDraft({ ...draft, type: t })}
                  className={
                    jGhost +
                    " py-2 text-[11px] " +
                    (draft.type === t ? "border-j-brand text-j-brand" : "")
                  }
                >
                  {LEAVE_TYPE[t]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">من</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.start_date ?? ""}
                  onChange={(e) => {
                    const start_date = e.target.value;
                    setDraft({
                      ...draft,
                      start_date,
                      /** النهاية تتبع البداية إن سبقتها، فلا تبقى مدّة سالبة */
                      end_date:
                        draft.end_date && draft.end_date < start_date ? start_date : draft.end_date,
                    });
                  }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">إلى</span>
                <input
                  type="date"
                  className={jField}
                  min={draft.start_date ?? undefined}
                  value={draft.end_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                />
              </label>
            </div>

            {draft.start_date && draft.end_date && draft.end_date >= draft.start_date && (
              <p className="mark text-xs text-j-dim">
                المدّة {days(draft.start_date, draft.end_date)} يوم
              </p>
            )}

            <textarea
              className={jField + " min-h-20 resize-none"}
              value={draft.note ?? ""}
              onChange={(e) => setDraft({ ...draft, note: e.target.value || null })}
              placeholder="السبب أو ملاحظة"
            />

            <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
              <span className="text-sm">معتمدة</span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--j-brand)]"
                checked={Boolean(draft.approved)}
                onChange={(e) => setDraft({ ...draft, approved: e.target.checked })}
              />
            </label>
          </>
        )}
      </Modal>
    </div>
  );
}
