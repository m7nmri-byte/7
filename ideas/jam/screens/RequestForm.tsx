"use client";

import { useState } from "react";
import type { Chain, Request } from "../types";
import { fetchChainSteps, logRequest, save } from "../db";
import { Modal, jField, jPrimary } from "../ui";
import { Attachments } from "../FileField";
import { KINDS, PRIORITY } from "./request-core";

export function RequestForm({
  draft,
  chains,
  me,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<Request> | null;
  chains: Chain[];
  me: string | null;
  onChange: (d: Partial<Request>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;

  const set = (p: Partial<Request>) => onChange({ ...draft, ...p });

  /** الطلب الجديد يدخل السلسلة فورًا عند أول معتمِد فيها */
  const submit = async () => {
    if (!draft.title?.trim()) return;
    setError(null);
    try {
      const chainId = draft.chain_id ?? chains.find((c) => c.is_active)?.id ?? null;
      const steps = chainId ? await fetchChainSteps(chainId) : [];
      const first = steps[0] ?? null;

      const row = (await save("jam_requests", {
        title: draft.title.trim(),
        kind: draft.kind ?? "general",
        body: draft.body ?? null,
        amount: draft.amount ?? null,
        priority: Number(draft.priority ?? 2),
        attachments: draft.attachments ?? [],
        created_by: me,
        chain_id: chainId,
        current_step: first?.step_order ?? 1,
        current_reviewer: first?.approver_id ?? null,
        status: first ? "pending" : "approved",
      })) as Request;

      await logRequest(row.id, "submitted", row.current_step, me);
      onClose();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الإرسال");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="طلب جديد"
      footer={
        <button onClick={() => void submit()} className={`${jPrimary} w-full`}>
          إرسال للاعتماد
        </button>
      }
    >
      {error && (
        <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
      )}

      <input
        className={jField}
        value={draft.title ?? ""}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="عنوان الطلب"
      />

      <textarea
        className={`${jField} min-h-28 resize-none`}
        value={draft.body ?? ""}
        onChange={(e) => set({ body: e.target.value || null })}
        placeholder="التفاصيل والمبرّر"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">النوع</span>
          <select
            className={jField}
            value={draft.kind ?? "general"}
            onChange={(e) => set({ kind: e.target.value })}
          >
            {KINDS.map((k) => (
              <option key={k.v} value={k.v}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الأولوية</span>
          <select
            className={jField}
            value={String(draft.priority ?? 2)}
            onChange={(e) => set({ priority: Number(e.target.value) })}
          >
            {PRIORITY.map((p) => (
              <option key={p.v} value={p.v}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المبلغ (إن وُجد)</span>
          <input
            type="number"
            className={`${jField} mark`}
            value={draft.amount ?? ""}
            onChange={(e) => set({ amount: e.target.value ? Number(e.target.value) : null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">سلسلة الاعتماد</span>
          <select
            className={jField}
            value={draft.chain_id ?? ""}
            onChange={(e) => set({ chain_id: e.target.value || null })}
          >
            <option value="">— الافتراضية —</option>
            {chains
              .filter((c) => c.is_active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <Attachments
        value={draft.attachments ?? []}
        onChange={(attachments) => set({ attachments })}
        folder="jam/requests"
      />
    </Modal>
  );
}
