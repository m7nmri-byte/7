"use client";
import { OptionGroups, useOptions } from "./options";

import { useState } from "react";
import type { Item } from "../matam/types";
import { addToCart, discounted } from "../matam/cart";
import { money } from "../matam/format";
import { MSheet, mField, mPrimary } from "../matam/ui";

/** اختيار الخيارات ثم الإضافة للسلة */
export function ItemSheet({
  item,
  items,
  onClose,
  onAdded,
  onOpenItem,
}: {
  item: Item | null;
  items: Item[];
  onClose: () => void;
  onAdded: () => void;
  onOpenItem: (i: Item) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  /**
   * الخيارات تُقرأ قبل أي خروج مبكّر: الخطّاف لا يجوز أن يكون مشروطًا.
   * ومجموعات الصنف الغائب فارغة، فلا ضرر.
   */
  const groups = item?.option_groups ?? [];
  const { picked, toggle, bump, chosen, missing, extras, reset } = useOptions(groups);

  if (!item) return null;

  const suggested = items.filter(
    (x) => (item.suggested_ids ?? []).includes(x.id) && x.is_available,
  );
  const base = item.exclude_base_price ? 0 : discounted(item);
  const unit = base + extras;

  const add = () => {
    if (missing.length) return;
    addToCart(item, chosen, qty, note.trim() || null);
    onAdded();
    onClose();
    reset();
    setQty(1);
    setNote("");
  };

  return (
    <MSheet
      open
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-m-line">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-2.5 text-m-dim"
              aria-label="أنقص"
            >
              −
            </button>
            <span className="mark w-7 text-center text-sm tabular-nums">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="px-3 py-2.5 text-m-dim"
              aria-label="زد"
            >
              +
            </button>
          </div>
          <button onClick={add} disabled={missing.length > 0} className={`${mPrimary} flex-1`}>
            {missing.length ? `اختر ${missing[0].name}` : `أضف · ${money(unit * qty)}`}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-44 w-full rounded-2xl object-cover"
          />
        )}

        {item.description && (
          <p className="text-sm leading-relaxed text-m-dim">{item.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-m-faint">
          {item.calories !== null && <span>{item.calories} سعرة</span>}
          {item.allergens.length > 0 && <span>مسبّبات حساسية: {item.allergens.join("، ")}</span>}
        </div>

        <OptionGroups groups={groups} picked={picked} toggle={toggle} bump={bump} />

        {suggested.length > 0 && (
          <section className="flex flex-col gap-2 border-t border-m-line pt-4">
            <h3 className="text-sm font-medium">يُطلب معه عادة</h3>
            <div className="m-noscroll flex gap-2 overflow-x-auto">
              {suggested.map((x) => (
                <button
                  key={x.id}
                  onClick={() => onOpenItem(x)}
                  className="flex w-28 shrink-0 flex-col gap-1 rounded-xl border border-m-line p-2 text-start"
                >
                  <span className="truncate text-xs font-medium">{x.name}</span>
                  <span className="text-xs text-m-accent">{money(discounted(x))}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">ملاحظة للمطبخ</span>
          <input
            className={mField}
            placeholder="مثال: بدون بصل"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
    </MSheet>
  );
}
