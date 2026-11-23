"use client";

import { remove, upsert } from "../matam/db";
import { money, sinceText } from "../matam/format";
import { MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";
import { ROLES, type AppUser, type UserStats } from "./users-core";

export function UserSheet({
  draft,
  stats,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<AppUser> | null;
  stats: UserStats | null;
  onChange: (d: Partial<AppUser>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!draft) return null;
  const set = (p: Partial<AppUser>) => onChange({ ...draft, ...p });

  const save = async () => {
    if (!draft.phone?.trim()) return;
    await upsert("matam_users", {
      ...(draft.id ? { id: draft.id } : {}),
      phone: draft.phone.trim(),
      name: draft.name?.trim() ?? "",
      role: draft.role ?? "customer",
      is_blocked: draft.is_blocked ?? false,
      notes: draft.notes ?? null,
    });
    onClose();
    onSaved();
  };

  const del = async () => {
    if (!draft.id) return;
    await remove("matam_users", draft.id);
    onClose();
    onSaved();
  };

  return (
    <MSheet
      open
      onClose={onClose}
      title={draft.id ? "تعديل مستخدم" : "مستخدم جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
            حفظ
          </button>
          {draft.id && (
            <button onClick={() => void del()} className={mDanger}>
              حذف
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <input
          className={mField}
          value={draft.name ?? ""}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="الاسم"
        />
        <input
          className={`${mField} mark`}
          dir="ltr"
          inputMode="tel"
          value={draft.phone ?? ""}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="05xxxxxxxx"
        />

        <div className="grid grid-cols-4 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => set({ role: r.key })}
              className={`${mGhost} py-2 text-xs ${
                draft.role === r.key ? "text-m-accent" : ""
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          className={`${mField} min-h-16 resize-none`}
          value={draft.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value || null })}
          placeholder="ملاحظة داخلية"
        />

        <button
          onClick={() => set({ is_blocked: !draft.is_blocked })}
          className={`${mGhost} ${draft.is_blocked ? "text-m-danger" : ""}`}
        >
          {draft.is_blocked ? "محظور — اضغط لرفع الحظر" : "حظر هذا المستخدم"}
        </button>

        {stats && (
          <dl className="flex flex-col gap-1.5 rounded-xl bg-m-raised p-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-m-dim">عدد الطلبات</dt>
              <dd className="mark">{stats.count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-m-dim">مجموع ما أنفق</dt>
              <dd className="mark">{money(stats.spent)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-m-dim">آخر طلب</dt>
              <dd>{sinceText(stats.last)}</dd>
            </div>
          </dl>
        )}
      </div>
    </MSheet>
  );
}
