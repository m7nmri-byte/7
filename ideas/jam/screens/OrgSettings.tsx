"use client";

import { useState } from "react";
import type { Settings } from "../types";
import { saveSettings } from "../db";
import { jField, jPrimary } from "../ui";
import { FileField } from "../FileField";

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const EMPTY: Settings = {
  name: "",
  logo_url: null,
  license_no: null,
  founded_on: null,
  vision: null,
  mission: null,
  values_text: null,
  address: null,
  phone: null,
  email: null,
  website: null,
  fiscal_start: 1,
};

/** مفتاحه `key` من المستدعي ليُعاد تركيبه حين تصل الإعدادات */
export function OrgSettings({
  settings,
  onChanged,
}: {
  settings: Settings | null;
  onChanged: () => void;
}) {
  const [row, setRow] = useState<Settings>(settings ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (p: Partial<Settings>) => {
    setRow({ ...row, ...p });
    setSaved(false);
  };

  const submit = async () => {
    setError(null);
    try {
      await saveSettings(row);
      setSaved(true);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex flex-col gap-4 rounded-2xl border border-j-line bg-j-surface p-5 shadow-j-sm">
        <span className="text-xs font-semibold text-j-dim">الهوية</span>

        <FileField
          label="الشعار"
          folder="jam/brand"
          value={row.logo_url}
          onChange={(f) => set({ logo_url: f ? f.url : null })}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">اسم الجمعية</span>
            <input
              className={jField}
              value={row.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">رقم الترخيص</span>
            <input
              className={jField + " mark"}
              value={row.license_no ?? ""}
              onChange={(e) => set({ license_no: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">تاريخ التأسيس</span>
            <input
              type="date"
              className={jField}
              value={row.founded_on ?? ""}
              onChange={(e) => set({ founded_on: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">بداية السنة المالية</span>
            <select
              className={jField}
              value={String(row.fiscal_start)}
              onChange={(e) => set({ fiscal_start: Number(e.target.value) })}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-j-line bg-j-surface p-5 shadow-j-sm">
        <span className="text-xs font-semibold text-j-dim">الرسالة</span>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الرؤية</span>
          <textarea
            className={jField + " min-h-20 resize-none leading-relaxed"}
            value={row.vision ?? ""}
            onChange={(e) => set({ vision: e.target.value || null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المهمّة</span>
          <textarea
            className={jField + " min-h-20 resize-none leading-relaxed"}
            value={row.mission ?? ""}
            onChange={(e) => set({ mission: e.target.value || null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">القيم</span>
          <textarea
            className={jField + " min-h-20 resize-none leading-relaxed"}
            value={row.values_text ?? ""}
            onChange={(e) => set({ values_text: e.target.value || null })}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-j-line bg-j-surface p-5 shadow-j-sm">
        <span className="text-xs font-semibold text-j-dim">التواصل</span>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">الهاتف</span>
            <input
              className={jField + " mark"}
              dir="ltr"
              value={row.phone ?? ""}
              onChange={(e) => set({ phone: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">البريد</span>
            <input
              className={jField}
              dir="ltr"
              value={row.email ?? ""}
              onChange={(e) => set({ email: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">الموقع</span>
            <input
              className={jField}
              dir="ltr"
              value={row.website ?? ""}
              onChange={(e) => set({ website: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">العنوان</span>
            <input
              className={jField}
              value={row.address ?? ""}
              onChange={(e) => set({ address: e.target.value || null })}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => void submit()} className={jPrimary}>
          حفظ الإعدادات
        </button>
        {saved && <span className="text-xs text-j-ok">حُفِظ</span>}
      </div>
    </div>
  );
}
