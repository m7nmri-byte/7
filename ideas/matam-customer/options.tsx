"use client";

import { useMemo, useState } from "react";
import type { ChosenOption, OptionGroup } from "../matam/types";
import { money } from "../matam/format";

export type Picked = Record<string, Record<string, number>>;

/**
 * حالة اختيار الخيارات وحسابها.
 *
 * استُخرجت من بطاقة الصنف ليشترك فيها الصنف والوجبة: الوجبة كانت
 * تُضاف بلا خيارات البتّة، فحقل option_item_ids في الإدارة بلا أثر.
 * وتكرار المنطق في موضعين يفترق بأوّل تعديل.
 */
export function useOptions(groups: OptionGroup[]) {
  const [picked, setPicked] = useState<Picked>({});

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

  const chosen: ChosenOption[] = useMemo(
    () =>
      groups
        .map((g): ChosenOption | null => {
          const qtys = picked[g.id] ?? {};
          const opts = g.options.filter((o) => (qtys[o.id] ?? 0) > 0);
          if (!opts.length) return null;
          return {
            group_id: g.id,
            group_name: g.name,
            names: opts.map((o) => (qtys[o.id] > 1 ? o.name + " ×" + qtys[o.id] : o.name)),
            quantities: opts.map((o) => qtys[o.id]),
            extra: opts.reduce((sum, o) => sum + (Number(o.price) || 0) * qtys[o.id], 0),
            ...(g.kitchen_control ? { kitchen: true } : {}),
          };
        })
        .filter((x): x is ChosenOption => x !== null),
    [groups, picked],
  );

  const missing = groups.filter((g) => g.required && !Object.keys(picked[g.id] ?? {}).length);
  const extras = chosen.reduce((s, o) => s + o.extra, 0);

  const reset = () => setPicked({});

  return { picked, toggle, bump, chosen, missing, extras, reset };
}

/** عرض مجموعات الخيارات — المظهر نفسه في الصنف والوجبة */
export function OptionGroups({
  groups,
  picked,
  toggle,
  bump,
}: {
  groups: OptionGroup[];
  picked: Picked;
  toggle: (groupId: string, optionId: string, single: boolean) => void;
  bump: (groupId: string, optionId: string, delta: number) => void;
}) {
  return (
    <>
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
    </>
  );
}
