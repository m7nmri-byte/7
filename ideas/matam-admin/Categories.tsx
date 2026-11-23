"use client";

import { useState } from "react";
import type { Category } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";
import { ImageField } from "../matam/ImageField";

const blank = (): Partial<Category> => ({
  name: "",
  sort_order: 0,
  is_active: true,
});

export function Categories({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Category> | null>(null);

  const save = async () => {
    if (!draft?.name?.trim()) return;
    await upsert("matam_categories", {
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      image_url: draft.image_url ?? null,
      sort_order: Number(draft.sort_order ?? 0),
      is_active: draft.is_active ?? true,
    });
    setDraft(null);
    onChanged();
  };

  const del = async (id: string) => {
    await remove("matam_categories", id);
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <button onClick={() => setDraft(blank())} className={mPrimary}>
        + فئة جديدة
      </button>

      {categories.length === 0 ? (
        <Empty title="لا فئات بعد" hint="الفئات تنظّم القائمة أمام الزبون" />
      ) : (
        categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setDraft(c)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{c.name}</span>
              <span className="mark text-[11px] text-m-faint">ترتيب {c.sort_order}</span>
            </span>
            {!c.is_active && <span className="text-[11px] text-m-faint">مخفية</span>}
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل فئة" : "فئة جديدة"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button onClick={() => void del(draft.id!)} className={mDanger}>
                حذف
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">الاسم</span>
              <input
                className={mField}
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="مثال: المشاوي"
              />
            </label>

            <ImageField
              value={draft.image_url ?? null}
              onChange={(url) => setDraft({ ...draft, image_url: url })}
              folder="matam/categories"
              label="صورة الفئة"
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">الترتيب</span>
              <input
                className={`${mField} mark`}
                inputMode="numeric"
                value={String(draft.sort_order ?? 0)}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: Number(e.target.value.replace(/\D/g, "")) || 0 })
                }
              />
            </label>

            <button
              onClick={() => setDraft({ ...draft, is_active: !(draft.is_active ?? true) })}
              className={mGhost}
            >
              {draft.is_active ?? true ? "ظاهرة للزبون" : "مخفية عن الزبون"}
            </button>
          </div>
        )}
      </MSheet>
    </div>
  );
}
