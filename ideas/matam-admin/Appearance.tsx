"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSaver } from "../matam/hooks";
import { mGhost, mPrimary } from "../matam/ui";
import { COLOR_FIELDS, DEFAULT_THEME, PRESETS, type Theme } from "./theme-core";

export function Appearance({
  theme,
  onChanged,
}: {
  theme: Theme | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Theme>(theme ?? DEFAULT_THEME);
  const saveState = useSaver();

  const set = (p: Partial<Theme>) => {
    setDraft({ ...draft, ...p });
    saveState.touch();
  };

  const save = () =>
    saveState.run(async () => {
      const { error } = await supabase.from("matam_theme").update(draft).eq("id", true);
      if (error) throw new Error(error.message);
      onChanged();
    });

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-m-dim">لوحات جاهزة</h2>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                set({
                  primary_color: p.primary_color,
                  bg_color: p.bg_color,
                  surface_color: p.surface_color,
                  text_color: p.text_color,
                })
              }
              className="flex flex-col items-center gap-1"
            >
              <span
                className="size-10 rounded-xl border border-m-line"
                style={{
                  background: `linear-gradient(135deg, ${p.primary_color} 50%, ${p.bg_color} 50%)`,
                }}
              />
              <span className="text-[10px] text-m-dim">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-m-dim">ألوان مخصّصة</h2>
        {COLOR_FIELDS.map((c) => (
          <label key={c.key} className="flex items-center justify-between gap-3">
            <span className="text-sm">{c.label}</span>
            <span className="flex items-center gap-2">
              <span className="mark text-[11px] text-m-faint" dir="ltr">
                {String(draft[c.key])}
              </span>
              <input
                type="color"
                value={String(draft[c.key])}
                onChange={(e) => set({ [c.key]: e.target.value } as Partial<Theme>)}
                className="size-9 cursor-pointer rounded-lg border border-m-line bg-transparent"
              />
            </span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-m-dim">عرض القائمة</h2>
        <div className="flex gap-2">
          {(
            [
              ["list", "قائمة"],
              ["grid", "شبكة"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => set({ menu_style: k })}
              className={`${mGhost} flex-1 py-2 text-xs ${
                draft.menu_style === k ? "text-m-accent" : ""
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(
            [
              ["soft", "ظلال ناعمة"],
              ["flat", "مسطّح"],
              ["outlined", "بحدود"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => set({ card_style: k })}
              className={`${mGhost} flex-1 py-2 text-xs ${
                draft.card_style === k ? "text-m-accent" : ""
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        {saveState.error && (
          <p className="rounded-lg bg-m-danger/15 px-3 py-2 text-xs text-m-danger">
            {saveState.error}
          </p>
        )}
        <button onClick={() => void save()} disabled={saveState.busy} className={mPrimary}>
          {saveState.busy ? "جارٍ الحفظ…" : saveState.saved ? "حُفظ ✓" : "حفظ المظهر"}
        </button>
      </div>
    </div>
  );
}
