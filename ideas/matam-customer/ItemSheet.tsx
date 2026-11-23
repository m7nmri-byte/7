"use client";

import { useState } from "react";
import type { ChosenOption, Item } from "../matam/types";
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
  // لكل مجموعة: معرّف الخيار ← كمّيته. الصفر يعني غير مختار
  const [picked, setPicked] = useState<Record<string, Record<string, number>>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  if (!item) return null;

  const groups = item.option_groups ?? [];
  const suggested = items.filter(
    (x) => (item.suggested_ids ?? []).includes(x.id) && x.is_available,
  );

  const toggle = (groupId: string, optionId: string, single: boolean) => {
    setPicked((prev) => {
      const cur = prev[groupId] ?? {};
      if (single) return { ...prev, [groupId]: { [optionId]: 1 } };
      const next = { ...cur };
      if (next[optionId]) delete next[optionId];
      else next[optionId] = 1;
      return { ...prev, [groupId]: next };
    });
  };

  const bump = (groupId: string, optionId: string, delta: number) => {
    setPicked((prev) => {
      const cur = { ...(prev[groupId] ?? {}) };
      const qty = (cur[optionId] ?? 0) + delta;
      if (qty <= 0) delete cur[optionId];
      else cur[optionId] = Math.min(20, qty);
      return { ...prev, [groupId]: cur };
    });
  };

  const chosen: ChosenOption[] = groups
    .map((g): ChosenOption | null => {
      const qtys = picked[g.id] ?? {};
      const opts = g.options.filter((o) => (qtys[o.id] ?? 0) > 0);
      if (!opts.length) return null;
      return {
        group_id: g.id,
        group_name: g.name,
        names: opts.map((o) => (qtys[o.id] > 1 ? `${o.name} ×${qtys[o.id]}` : o.name)),
        quantities: opts.map((o) => qtys[o.id]),
        extra: opts.reduce((sum, o) => sum + (Number(o.price) || 0) * qtys[o.id], 0),
        ...(g.kitchen_control ? { kitchen: true } : {}),
      };
    })
    .filter((x): x is ChosenOption => x !== null);

  const missing = groups.filter(
    (g) => g.required && !Object.keys(picked[g.id] ?? {}).length,
  );
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
          const qtys = picked[g.id] ?? {};
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
                const qty = qtys[o.id] ?? 0;
                const on = qty > 0;
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
                    <span className="flex items-center gap-2">
                      {Number(o.price) > 0 && (
                        <span className="text-xs text-m-accent">+{money(Number(o.price))}</span>
                      )}
                      {on && g.allow_quantity && (
                        <span className="flex items-center gap-1 rounded-lg bg-m-surface">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              bump(g.id, o.id, -1);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && bump(g.id, o.id, -1)}
                            className="px-2 py-0.5 text-m-dim"
                          >
                            −
                          </span>
                          <span className="mark w-4 text-center text-xs tabular-nums">{qty}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              bump(g.id, o.id, 1);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && bump(g.id, o.id, 1)}
                            className="px-2 py-0.5 text-m-dim"
                          >
                            +
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </fieldset>
          );
        })}

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
