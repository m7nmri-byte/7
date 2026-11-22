"use client";

import { useState } from "react";
import type { Combo, Item } from "../matam/types";
import { addToCart } from "../matam/cart";
import { money } from "../matam/format";
import { MSheet, mField, mPrimary } from "../matam/ui";

/**
 * الوجبة المركّبة: عدة أصناف بسعر واحد.
 * تُضاف للسلة كسطر واحد سعره سعر الوجبة، ومحتوياتها مذكورة في
 * خياراته — فيصل المطبخ ما يحضّره مفصّلًا، ولا يُحسب السعر مرتين.
 */
export function ComboSheet({
  combo,
  items,
  onClose,
  onAdded,
}: {
  combo: Combo | null;
  items: Item[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  if (!combo) return null;

  const contents = combo.items
    .map((r) => {
      const it = items.find((x) => x.id === r.item_id);
      return it ? `${it.name}${r.qty > 1 ? ` ×${r.qty}` : ""}` : null;
    })
    .filter((x): x is string => x !== null);

  const add = () => {
    // يُمثَّل كصنف بسعره الخاص، واسم الوجبة هو اسمه
    addToCart(
      {
        id: combo.id,
        category_id: null,
        name: combo.name,
        description: combo.description ?? "",
        price: Number(combo.price),
        image_url: combo.image_url,
        is_available: true,
        sort_order: 0,
        tags: [],
        discount_percent: null,
        is_best_seller: false,
        is_new: false,
        calories: null,
        allergens: [],
        suggested_ids: [],
        exclude_base_price: false,
        option_groups: [],
      },
      contents.length
        ? [
            {
              group_id: "combo",
              group_name: "تشمل",
              names: contents,
              extra: 0,
            },
          ]
        : [],
      qty,
      note.trim() || null,
    );
    onAdded();
    onClose();
    setQty(1);
    setNote("");
  };

  return (
    <MSheet
      open
      onClose={onClose}
      title={combo.name}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-m-line">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5 text-m-dim">
              −
            </button>
            <span className="mark w-7 text-center text-sm tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2.5 text-m-dim">
              +
            </button>
          </div>
          <button onClick={add} className={`${mPrimary} flex-1`}>
            أضف · {money(Number(combo.price) * qty)}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {combo.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={combo.image_url}
            alt={combo.name}
            className="h-44 w-full rounded-2xl object-cover"
          />
        )}

        {combo.description && (
          <p className="text-sm leading-relaxed text-m-dim">{combo.description}</p>
        )}

        {contents.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-m-dim">تشمل</h3>
            <ul className="flex flex-col gap-1.5">
              {contents.map((c) => (
                <li key={c} className="rounded-lg bg-m-raised px-3 py-2 text-sm">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">ملاحظة للمطبخ</span>
          <input
            className={mField}
            placeholder="اختياري"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
    </MSheet>
  );
}
