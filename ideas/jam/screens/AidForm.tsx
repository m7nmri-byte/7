"use client";

import type { Aid, Program } from "../types";
import { AID_STATUS } from "../types";
import { save } from "../db";
import { Modal, jField, jPrimary } from "../ui";

export const AID_TONE: Record<string, string> = {
  requested: "var(--j-warn)",
  approved: "var(--j-info)",
  disbursed: "var(--j-ok)",
  rejected: "var(--j-danger)",
};

export function AidForm({
  draft,
  beneficiaryId,
  programs,
  me,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<Aid> | null;
  beneficiaryId: string | null;
  programs: Program[];
  me: string | null;
  onChange: (d: Partial<Aid>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!draft || !beneficiaryId) return null;
  const set = (p: Partial<Aid>) => onChange({ ...draft, ...p });

  const submit = async () => {
    await save("jam_aids", {
      ...(draft.id ? { id: draft.id } : {}),
      beneficiary_id: beneficiaryId,
      program_id: draft.program_id ?? null,
      kind: draft.kind ?? "cash",
      amount: Number(draft.amount ?? 0),
      description: draft.description ?? null,
      status: draft.status ?? "requested",
      requested_by: me,
      disbursed_at: draft.status === "disbursed" ? new Date().toISOString() : null,
    });
    onClose();
    onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={draft.id ? "تعديل مساعدة" : "مساعدة جديدة"}
      footer={
        <button onClick={() => void submit()} className={`${jPrimary} w-full`}>
          حفظ
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المبلغ</span>
          <input
            type="number"
            className={`${jField} mark`}
            value={draft.amount ?? ""}
            onChange={(e) => set({ amount: Number(e.target.value) || 0 })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">النوع</span>
          <select
            className={jField}
            value={draft.kind ?? "cash"}
            onChange={(e) => set({ kind: e.target.value })}
          >
            <option value="cash">نقدية</option>
            <option value="goods">عينية</option>
            <option value="service">خدمة</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">البرنامج</span>
          <select
            className={jField}
            value={draft.program_id ?? ""}
            onChange={(e) => set({ program_id: e.target.value || null })}
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
          <span className="text-xs text-j-dim">الحالة</span>
          <select
            className={jField}
            value={draft.status ?? "requested"}
            onChange={(e) => set({ status: e.target.value as Aid["status"] })}
          >
            {(Object.keys(AID_STATUS) as (keyof typeof AID_STATUS)[]).map((s) => (
              <option key={s} value={s}>
                {AID_STATUS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        className={`${jField} min-h-20 resize-none`}
        value={draft.description ?? ""}
        onChange={(e) => set({ description: e.target.value || null })}
        placeholder="وصف المساعدة"
      />
    </Modal>
  );
}
