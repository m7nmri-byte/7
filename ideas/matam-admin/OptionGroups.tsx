"use client";

import type { ItemOption, OptionGroup } from "../matam/types";
import { mField, mGhost } from "../matam/ui";

const uid = () => Math.random().toString(36).slice(2, 10);

export const newGroup = (): OptionGroup => ({
  id: uid(),
  name: "",
  type: "single",
  required: false,
  options: [],
  allow_quantity: false,
  kitchen_control: false,
});

const newOption = (): ItemOption => ({
  id: uid(),
  name: "",
  price: 0,
  available: true,
});

/** محرّر مجموعات الخيارات: الأحجام والإضافات التي يختارها الزبون */
export function OptionGroupsEditor({
  groups,
  onChange,
}: {
  groups: OptionGroup[];
  onChange: (g: OptionGroup[]) => void;
}) {
  const patch = (i: number, p: Partial<OptionGroup>) =>
    onChange(groups.map((g, k) => (k === i ? { ...g, ...p } : g)));

  const patchOption = (gi: number, oi: number, p: Partial<ItemOption>) =>
    patch(gi, {
      options: groups[gi].options.map((o, k) => (k === oi ? { ...o, ...p } : o)),
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-m-dim">مجموعات الخيارات</span>
        <button
          onClick={() => onChange([...groups, newGroup()])}
          className="text-xs text-m-accent"
        >
          + مجموعة
        </button>
      </div>

      {groups.map((g, gi) => (
        <div key={g.id} className="flex flex-col gap-2 rounded-xl border border-m-line p-3">
          <div className="flex gap-2">
            <input
              className={mField}
              value={g.name}
              onChange={(e) => patch(gi, { name: e.target.value })}
              placeholder="اسم المجموعة — مثال: الحجم"
            />
            <button
              onClick={() => onChange(groups.filter((_, k) => k !== gi))}
              aria-label="احذف المجموعة"
              className="shrink-0 px-2 text-m-faint hover:text-m-danger"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => patch(gi, { type: g.type === "single" ? "multi" : "single" })}
              className={`${mGhost} py-2 text-xs`}
            >
              {g.type === "single" ? "اختيار واحد" : "اختيار متعدّد"}
            </button>
            <button
              onClick={() => patch(gi, { required: !g.required })}
              className={`${mGhost} py-2 text-xs ${g.required ? "text-m-accent" : ""}`}
            >
              {g.required ? "مطلوبة" : "اختيارية"}
            </button>
            <button
              onClick={() => patch(gi, { allow_quantity: !g.allow_quantity })}
              className={`${mGhost} py-2 text-xs ${g.allow_quantity ? "text-m-accent" : ""}`}
              title="يسمح بتكرار الخيار الواحد"
            >
              {g.allow_quantity ? "بكمّية" : "بلا كمّية"}
            </button>
            <button
              onClick={() => patch(gi, { kitchen_control: !g.kitchen_control })}
              className={`${mGhost} py-2 text-xs ${g.kitchen_control ? "text-m-accent" : ""}`}
              title="يظهر بارزًا في المطبخ"
            >
              {g.kitchen_control ? "يهمّ المطبخ" : "لا يهمّ المطبخ"}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {g.options.map((o, oi) => (
              <div key={o.id} className="flex gap-2">
                <input
                  className={`${mField} py-2 text-xs`}
                  value={o.name}
                  onChange={(e) => patchOption(gi, oi, { name: e.target.value })}
                  placeholder="اسم الخيار"
                />
                <input
                  className={`${mField} mark w-20 py-2 text-xs`}
                  inputMode="decimal"
                  value={String(o.price ?? 0)}
                  onChange={(e) =>
                    patchOption(gi, oi, { price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })
                  }
                  placeholder="0"
                />
                <button
                  onClick={() =>
                    patch(gi, { options: g.options.filter((_, k) => k !== oi) })
                  }
                  aria-label="احذف الخيار"
                  className="shrink-0 px-1 text-m-faint hover:text-m-danger"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => patch(gi, { options: [...g.options, newOption()] })}
              className="self-start text-xs text-m-accent"
            >
              + خيار
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
