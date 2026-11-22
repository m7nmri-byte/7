"use client";

import { useState } from "react";
import type { Combo, Item } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { money } from "../matam/format";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

export function Combos({
  combos,
  items,
  onChanged,
}: {
  combos: Combo[];
  items: Item[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Combo> | null>(null);

  const save = async () => {
    if (!draft?.name?.trim()) return;
    await upsert("matam_combos", {
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      description: draft.description ?? null,
      image_url: draft.image_url ?? null,
      price: Number(draft.price ?? 0),
      is_active: draft.is_active ?? true,
      sort_order: Number(draft.sort_order ?? 0),
      items: draft.items ?? [],
      option_item_ids: draft.option_item_ids ?? [],
    });
    setDraft(null);
    onChanged();
  };

  const toggleItem = (itemId: string) => {
    const list = draft?.items ?? [];
    const has = list.some((r) => r.item_id === itemId);
    setDraft({
      ...draft,
      items: has
        ? list.filter((r) => r.item_id !== itemId)
        : [...list, { item_id: itemId, qty: 1 }],
    });
  };

  const setQty = (itemId: string, qty: number) =>
    setDraft({
      ...draft,
      items: (draft?.items ?? []).map((r) =>
        r.item_id === itemId ? { ...r, qty: Math.max(1, qty) } : r,
      ),
    });

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => setDraft({ name: "", price: 0, is_active: true, items: [] })}
        className={mPrimary}
      >
        + وجبة مركّبة
      </button>

      {combos.length === 0 ? (
        <Empty title="لا وجبات مركّبة" hint="اجمع عدة أصناف بسعر واحد" />
      ) : (
        combos.map((c) => (
          <button
            key={c.id}
            onClick={() => setDraft(c)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{c.name}</span>
              <span className="text-[11px] text-m-faint">{c.items.length} صنف</span>
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="text-sm font-semibold text-m-accent">{money(c.price)}</span>
              {!c.is_active && <span className="text-[11px] text-m-faint">مخفية</span>}
            </span>
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل وجبة" : "وجبة مركّبة"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_combos", draft.id!);
                  setDraft(null);
                  onChanged();
                }}
                className={mDanger}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <input
              className={mField}
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="اسم الوجبة"
            />
            <textarea
              className={`${mField} min-h-16 resize-none`}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
              placeholder="الوصف"
            />
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs text-m-dim">السعر</span>
                <input
                  className={`${mField} mark`}
                  inputMode="decimal"
                  value={String(draft.price ?? 0)}
                  onChange={(e) => setDraft({ ...draft, price: num(e.target.value) })}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs text-m-dim">الترتيب</span>
                <input
                  className={`${mField} mark`}
                  inputMode="numeric"
                  value={String(draft.sort_order ?? 0)}
                  onChange={(e) => setDraft({ ...draft, sort_order: num(e.target.value) })}
                />
              </label>
            </div>
            <input
              className={`${mField} mark`}
              dir="ltr"
              value={draft.image_url ?? ""}
              onChange={(e) => setDraft({ ...draft, image_url: e.target.value || null })}
              placeholder="رابط الصورة"
            />

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-m-dim">أصناف الوجبة</span>
              {items.length === 0 ? (
                <p className="text-xs text-m-faint">أضف أصنافًا أولًا</p>
              ) : (
                items.map((it) => {
                  const row = (draft.items ?? []).find((r) => r.item_id === it.id);
                  return (
                    <div key={it.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleItem(it.id)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-start text-xs transition-colors ${
                          row ? "border-m-accent bg-m-accent-soft" : "border-m-line"
                        }`}
                      >
                        {it.name}
                      </button>
                      {row && (
                        <input
                          className={`${mField} mark w-16 py-1.5 text-center text-xs`}
                          inputMode="numeric"
                          value={String(row.qty)}
                          onChange={(e) => setQty(it.id, num(e.target.value))}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setDraft({ ...draft, is_active: !(draft.is_active ?? true) })}
              className={mGhost}
            >
              {draft.is_active ?? true ? "ظاهرة" : "مخفية"}
            </button>
          </div>
        )}
      </MSheet>
    </div>
  );
}
