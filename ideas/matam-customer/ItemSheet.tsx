"use client";

import { useState } from "react";
import type { ChosenOption, Item } from "../matam/types";
import { addToCart, discounted } from "../matam/cart";
import { money } from "../matam/format";
import { MSheet, mField, mPrimary } from "../matam/ui";

/** اختيار الخيارات ثم الإضافة للسلة */
export function ItemSheet({
  item,
  onClose,
  onAdded,
}: {
  item: Item | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  if (!item) return null;

  const groups = item.option_groups ?? [];

  const toggle = (groupId: string, optionId: string, single: boolean) => {
    setPicked((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: [optionId] };
      return {
        ...prev,
        [groupId]: cur.includes(optionId)
          ? cur.filter((x) => x !== optionId)
          : [...cur, optionId],
      };
    });
  };

  const chosen: ChosenOption[] = groups
    .map((g) => {
      const ids = picked[g.id] ?? [];
      const opts = g.options.filter((o) => ids.includes(o.id));
      if (!opts.length) return null;
      return {
        group_id: g.id,
        group_name: g.name,
        names: opts.map((o) => o.name),
        extra: opts.reduce((s, o) => s + (Number(o.price) || 0), 0),
      };
    })
    .filter((x): x is ChosenOption => x !== null);

  const missing = groups.filter((g) => g.required && !(picked[g.id] ?? []).length);
  const extras = chosen.reduce((s, o) => s + o.extra, 0);
  const base = item.exclude_base_price ? 0 : discounted(item);
  const unit = base + extras;

  const add = () => {
    if (missing.length) return;
    addToCart(item, chosen, qty, note.trim() || null);
    onAdded();
    onClose();
    setPicked({});
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

        {groups.map((g) => {
          const single = g.type === "single";
          const ids = picked[g.id] ?? [];
          return (
            <fieldset key={g.id} className="flex flex-col gap-2">
              <legend className="mb-1 flex items-center gap-2 text-sm font-medium">
                {g.name}
                {g.required && <span className="text-[11px] text-m-danger">مطلوب</span>}
                <span className="text-[11px] text-m-faint">
                  {single ? "اختر واحدًا" : "اختر ما تشاء"}
                </span>
              </legend>
              {g.options.map((o) => {
                const on = ids.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={o.available === false}
                    onClick={() => toggle(g.id, o.id, single)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors disabled:opacity-40 ${
                      on ? "border-m-accent bg-m-accent-soft" : "border-m-line bg-m-raised"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className={`grid size-4 place-items-center border ${
                          single ? "rounded-full" : "rounded"
                        } ${on ? "border-m-accent" : "border-m-faint"}`}
                      >
                        {on && <span className="size-2 rounded-full bg-m-accent" />}
                      </span>
                      {o.name}
                    </span>
                    {Number(o.price) > 0 && (
                      <span className="text-xs text-m-accent">+{money(Number(o.price))}</span>
                    )}
                  </button>
                );
              })}
            </fieldset>
          );
        })}

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
