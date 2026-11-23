"use client";

import { useState } from "react";
import type { Category, Item } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { money } from "../matam/format";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";
import { ImageField } from "../matam/ImageField";
import { OptionGroupsEditor } from "./OptionGroups";

const blank = (): Partial<Item> => ({
  name: "",
  description: "",
  price: 0,
  is_available: true,
  sort_order: 0,
  tags: [],
  allergens: [],
  suggested_ids: [],
  option_groups: [],
  is_best_seller: false,
  is_new: false,
  exclude_base_price: false,
});

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

export function Items({
  items,
  categories,
  onChanged,
}: {
  items: Item[];
  categories: Category[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Item> | null>(null);
  const [filter, setFilter] = useState("all");

  const list = filter === "all" ? items : items.filter((i) => i.category_id === filter);

  const save = async () => {
    if (!draft?.name?.trim()) return;
    await upsert("matam_items", {
      ...(draft.id ? { id: draft.id } : {}),
      category_id: draft.category_id ?? null,
      name: draft.name.trim(),
      description: draft.description ?? "",
      price: Number(draft.price ?? 0),
      image_url: draft.image_url ?? null,
      is_available: draft.is_available ?? true,
      sort_order: Number(draft.sort_order ?? 0),
      tags: draft.tags ?? [],
      discount_percent: draft.discount_percent ?? null,
      is_best_seller: draft.is_best_seller ?? false,
      is_new: draft.is_new ?? false,
      calories: draft.calories ?? null,
      allergens: draft.allergens ?? [],
      suggested_ids: draft.suggested_ids ?? [],
      exclude_base_price: draft.exclude_base_price ?? false,
      option_groups: draft.option_groups ?? [],
    });
    setDraft(null);
    onChanged();
  };

  const del = async (id: string) => {
    await remove("matam_items", id);
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col">
      <div className="m-noscroll flex gap-2 overflow-x-auto border-b border-m-line px-4 py-3">
        {[{ id: "all", name: "الكل" }, ...categories].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
              filter === c.id
                ? "bg-m-accent font-semibold text-[#ffffff]"
                : "border border-m-line text-m-dim"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <button onClick={() => setDraft(blank())} className={mPrimary}>
          + صنف جديد
        </button>

        {list.length === 0 ? (
          <Empty title="لا أصناف" hint="أضف أول صنف ليظهر عند الزبون" />
        ) : (
          list.map((it) => (
            <button
              key={it.id}
              onClick={() => setDraft(it)}
              className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{it.name}</span>
                <span className="text-[11px] text-m-faint">
                  {categories.find((c) => c.id === it.category_id)?.name ?? "بلا فئة"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-sm font-semibold text-m-accent">{money(it.price)}</span>
                {!it.is_available && <span className="text-[11px] text-m-danger">غير متوفر</span>}
              </span>
            </button>
          ))
        )}
      </div>

      <ItemSheet
        draft={draft}
        categories={categories}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSave={save}
        onDelete={del}
      />
    </div>
  );
}

/** نموذج تحرير الصنف بكل حقوله */
function ItemSheet({
  draft,
  categories,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Partial<Item> | null;
  categories: Category[];
  onChange: (d: Partial<Item>) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}) {
  if (!draft) return null;
  const set = (p: Partial<Item>) => onChange({ ...draft, ...p });

  return (
    <MSheet
      open
      onClose={onClose}
      title={draft.id ? "تعديل صنف" : "صنف جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={onSave} className={`${mPrimary} flex-1`}>
            حفظ
          </button>
          {draft.id && (
            <button onClick={() => onDelete(draft.id!)} className={mDanger}>
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
          placeholder="اسم الصنف"
        />

        <textarea
          className={`${mField} min-h-20 resize-none`}
          value={draft.description ?? ""}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="الوصف"
        />

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">السعر</span>
            <input
              className={`${mField} mark`}
              inputMode="decimal"
              value={String(draft.price ?? 0)}
              onChange={(e) => set({ price: num(e.target.value) })}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">خصم ٪</span>
            <input
              className={`${mField} mark`}
              inputMode="numeric"
              value={String(draft.discount_percent ?? "")}
              onChange={(e) =>
                set({ discount_percent: e.target.value ? num(e.target.value) : null })
              }
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-m-dim">الفئة</span>
          <select
            className={mField}
            value={draft.category_id ?? ""}
            onChange={(e) => set({ category_id: e.target.value || null })}
          >
            <option value="">— بلا فئة —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <ImageField
          value={draft.image_url ?? null}
          onChange={(url) => set({ image_url: url })}
          folder="matam/items"
          label="صورة الصنف"
        />

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">السعرات</span>
            <input
              className={`${mField} mark`}
              inputMode="numeric"
              value={String(draft.calories ?? "")}
              onChange={(e) => set({ calories: e.target.value ? num(e.target.value) : null })}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-m-dim">الترتيب</span>
            <input
              className={`${mField} mark`}
              inputMode="numeric"
              value={String(draft.sort_order ?? 0)}
              onChange={(e) => set({ sort_order: num(e.target.value) })}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["is_available", "متوفر"],
              ["is_new", "جديد"],
              ["is_best_seller", "الأكثر طلبًا"],
              ["exclude_base_price", "بلا سعر أساسي"],
            ] as const
          ).map(([key, label]) => {
            const on = Boolean(draft[key]);
            return (
              <button
                key={key}
                onClick={() => set({ [key]: !on } as Partial<Item>)}
                className={`${mGhost} py-2 text-xs ${on ? "border-m-accent text-m-accent" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <OptionGroupsEditor
          groups={draft.option_groups ?? []}
          onChange={(g) => set({ option_groups: g })}
        />
      </div>
    </MSheet>
  );
}
