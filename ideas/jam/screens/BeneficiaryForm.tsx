"use client";

import { useState } from "react";
import type { Beneficiary } from "../types";
import { remove, save } from "../db";
import { Modal, jField, jGhost, jPrimary } from "../ui";

export const CATEGORIES = [
  "أيتام",
  "أرامل",
  "أسر منتجة",
  "ذوو إعاقة",
  "طلاب",
  "كبار سنّ",
  "أخرى",
];

export function BeneficiaryForm({
  draft,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<Beneficiary> | null;
  onChange: (d: Partial<Beneficiary>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;

  const set = (p: Partial<Beneficiary>) => onChange({ ...draft, ...p });

  const submit = async () => {
    if (!draft.name?.trim()) return;
    setError(null);
    try {
      await save("jam_beneficiaries", {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        national_id: draft.national_id || null,
        phone: draft.phone || null,
        gender: draft.gender || null,
        birth_date: draft.birth_date || null,
        family_size: draft.family_size ?? null,
        city: draft.city || null,
        district: draft.district || null,
        address: draft.address || null,
        category: draft.category || null,
        income: draft.income ?? null,
        notes: draft.notes || null,
        is_active: draft.is_active ?? true,
      });
      onClose();
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذّر الحفظ";
      // رقم الهوية فريد — الرسالة الخام غامضة فنوضّحها
      setError(
        msg.includes("duplicate") || msg.includes("unique")
          ? "رقم الهوية مسجّل لمستفيد آخر"
          : msg,
      );
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={draft.id ? "تعديل مستفيد" : "مستفيد جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void submit()} className={`${jPrimary} flex-1`}>
            حفظ
          </button>
          {draft.id && (
            <button
              onClick={async () => {
                await remove("jam_beneficiaries", draft.id!);
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
          placeholder="الاسم الكامل"
        />
        <input
          className={`${jField} mark`}
          dir="ltr"
          value={draft.national_id ?? ""}
          onChange={(e) => set({ national_id: e.target.value || null })}
          placeholder="رقم الهوية"
        />
        <input
          className={`${jField} mark`}
          dir="ltr"
          value={draft.phone ?? ""}
          onChange={(e) => set({ phone: e.target.value || null })}
          placeholder="الجوال"
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">تاريخ الميلاد</span>
          <input
            type="date"
            className={jField}
            value={draft.birth_date ?? ""}
            onChange={(e) => set({ birth_date: e.target.value || null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الفئة</span>
          <select
            className={jField}
            value={draft.category ?? ""}
            onChange={(e) => set({ category: e.target.value || null })}
          >
            <option value="">— غير محدّد —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الجنس</span>
          <select
            className={jField}
            value={draft.gender ?? ""}
            onChange={(e) => set({ gender: e.target.value || null })}
          >
            <option value="">— غير محدّد —</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">عدد أفراد الأسرة</span>
          <input
            type="number"
            className={`${jField} mark`}
            value={draft.family_size ?? ""}
            onChange={(e) =>
              set({ family_size: e.target.value ? Number(e.target.value) : null })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الدخل الشهري</span>
          <input
            type="number"
            className={`${jField} mark`}
            value={draft.income ?? ""}
            onChange={(e) => set({ income: e.target.value ? Number(e.target.value) : null })}
          />
        </label>

        <input
          className={jField}
          value={draft.city ?? ""}
          onChange={(e) => set({ city: e.target.value || null })}
          placeholder="المدينة"
        />
        <input
          className={jField}
          value={draft.district ?? ""}
          onChange={(e) => set({ district: e.target.value || null })}
          placeholder="الحي"
        />
      </div>

      <textarea
        className={`${jField} min-h-16 resize-none`}
        value={draft.address ?? ""}
        onChange={(e) => set({ address: e.target.value || null })}
        placeholder="العنوان التفصيلي"
      />

      <textarea
        className={`${jField} min-h-20 resize-none`}
        value={draft.notes ?? ""}
        onChange={(e) => set({ notes: e.target.value || null })}
        placeholder="ملاحظات الباحث الاجتماعي"
      />

      <button
        onClick={() => set({ is_active: !(draft.is_active ?? true) })}
        className={`${jGhost} ${draft.is_active ?? true ? "" : "text-j-danger"}`}
      >
        {draft.is_active ?? true ? "ملف نشط" : "ملف موقوف"}
      </button>
    </Modal>
  );
}
