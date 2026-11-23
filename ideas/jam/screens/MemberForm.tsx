"use client";

import { useState } from "react";
import type { Department, Member, MemberRole, Shift } from "../types";
import { ROLE_LABEL } from "../types";
import { remove, save } from "../db";
import { Modal, jField, jGhost, jPrimary } from "../ui";

export function MemberForm({
  draft,
  members,
  departments,
  shifts,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<Member> | null;
  members: Member[];
  departments: Department[];
  shifts: Shift[];
  onChange: (d: Partial<Member>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;

  const set = (p: Partial<Member>) => onChange({ ...draft, ...p });

  const submit = async () => {
    if (!draft.name?.trim()) return;
    setError(null);
    try {
      await save("jam_members", {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        phone: draft.phone || null,
        email: draft.email || null,
        job_title: draft.job_title || null,
        department_id: draft.department_id || null,
        manager_id: draft.manager_id || null,
        role: draft.role ?? "member",
        hired_at: draft.hired_at || null,
        annual_leave_days: Number(draft.annual_leave_days ?? 21),
        remote_allowed: draft.remote_allowed ?? false,
        shift_id: draft.shift_id || null,
        is_active: draft.is_active ?? true,
      });
      onClose();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={draft.id ? "تعديل موظف" : "موظف جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void submit()} className={`${jPrimary} flex-1`}>
            حفظ
          </button>
          {draft.id && (
            <button
              onClick={async () => {
                await remove("jam_members", draft.id!);
                onClose();
                onSaved();
              }}
              className={jGhost}
            >
              حذف
            </button>
          )}
        </div>
      }
    >
      {error && (
        <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          className={jField}
          value={draft.name ?? ""}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="الاسم"
        />
        <input
          className={jField}
          value={draft.job_title ?? ""}
          onChange={(e) => set({ job_title: e.target.value || null })}
          placeholder="المسمّى الوظيفي"
        />
        <input
          className={`${jField} mark`}
          dir="ltr"
          value={draft.phone ?? ""}
          onChange={(e) => set({ phone: e.target.value || null })}
          placeholder="الجوال"
        />
        <input
          className={`${jField} mark`}
          dir="ltr"
          value={draft.email ?? ""}
          onChange={(e) => set({ email: e.target.value || null })}
          placeholder="البريد"
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الإدارة</span>
          <select
            className={jField}
            value={draft.department_id ?? ""}
            onChange={(e) => set({ department_id: e.target.value || null })}
          >
            <option value="">— بلا إدارة —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المدير المباشر</span>
          <select
            className={jField}
            value={draft.manager_id ?? ""}
            onChange={(e) => set({ manager_id: e.target.value || null })}
          >
            <option value="">— لا يوجد —</option>
            {members
              .filter((x) => x.id !== draft.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">مجموعة الدوام</span>
          <select
            className={jField}
            value={draft.shift_id ?? ""}
            onChange={(e) => set({ shift_id: e.target.value || null })}
          >
            <option value="">— الافتراضية —</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">تاريخ التعيين</span>
          <input
            type="date"
            className={jField}
            value={draft.hired_at ?? ""}
            onChange={(e) => set({ hired_at: e.target.value || null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">رصيد الإجازة السنوية</span>
          <input
            type="number"
            className={`${jField} mark`}
            value={String(draft.annual_leave_days ?? 21)}
            onChange={(e) => set({ annual_leave_days: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ROLE_LABEL) as MemberRole[]).map((r) => (
          <button
            key={r}
            onClick={() => set({ role: r })}
            className={`${jGhost} py-2 text-xs ${
              draft.role === r ? "border-j-brand text-j-brand" : ""
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => set({ remote_allowed: !draft.remote_allowed })}
          className={`${jGhost} flex-1 py-2 text-xs ${
            draft.remote_allowed ? "border-j-brand text-j-brand" : ""
          }`}
        >
          {draft.remote_allowed ? "يسمح بالعمل عن بُعد" : "حضوري فقط"}
        </button>
        <button
          onClick={() => set({ is_active: !(draft.is_active ?? true) })}
          className={`${jGhost} flex-1 py-2 text-xs ${
            draft.is_active ?? true ? "" : "text-j-danger"
          }`}
        >
          {draft.is_active ?? true ? "على رأس العمل" : "موقوف"}
        </button>
      </div>
    </Modal>
  );
}
