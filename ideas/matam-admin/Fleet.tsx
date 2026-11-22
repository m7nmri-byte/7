"use client";

import { useState } from "react";
import type { Driver, Zone } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { money } from "../matam/format";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

export function Drivers({
  drivers,
  onChanged,
}: {
  drivers: Driver[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Driver> | null>(null);

  const save = async () => {
    if (!draft?.name?.trim()) return;
    await upsert("matam_drivers", {
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      phone: draft.phone ?? null,
      is_active: draft.is_active ?? true,
    });
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <button onClick={() => setDraft({ name: "", is_active: true })} className={mPrimary}>
        + مندوب جديد
      </button>

      {drivers.length === 0 ? (
        <Empty title="لا مندوبين" hint="أضفهم ليظهروا في تطبيق المندوب" />
      ) : (
        drivers.map((d) => (
          <button
            key={d.id}
            onClick={() => setDraft(d)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{d.name}</span>
              {d.phone && (
                <span className="mark text-[11px] text-m-faint" dir="ltr">
                  {d.phone}
                </span>
              )}
            </span>
            {!d.is_active && <span className="text-[11px] text-m-faint">موقوف</span>}
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل مندوب" : "مندوب جديد"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_drivers", draft.id!);
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
              placeholder="الاسم"
            />
            <input
              className={`${mField} mark`}
              dir="ltr"
              inputMode="tel"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
              placeholder="05xxxxxxxx"
            />
            <button
              onClick={() => setDraft({ ...draft, is_active: !(draft.is_active ?? true) })}
              className={mGhost}
            >
              {draft.is_active ?? true ? "نشط" : "موقوف"}
            </button>
          </div>
        )}
      </MSheet>
    </div>
  );
}

export function Zones({ zones, onChanged }: { zones: Zone[]; onChanged: () => void }) {
  const [draft, setDraft] = useState<Partial<Zone> | null>(null);

  const save = async () => {
    if (!draft?.name?.trim()) return;
    await upsert("matam_zones", {
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      max_distance_km: Number(draft.max_distance_km ?? 0),
      fee: Number(draft.fee ?? 0),
      sort_order: Number(draft.sort_order ?? 0),
    });
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => setDraft({ name: "", fee: 0, max_distance_km: 0, sort_order: 0 })}
        className={mPrimary}
      >
        + منطقة توصيل
      </button>

      {zones.length === 0 ? (
        <Empty title="لا مناطق" hint="تُستعمل لحساب رسوم التوصيل" />
      ) : (
        zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setDraft(z)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{z.name}</span>
              <span className="mark text-[11px] text-m-faint">
                حتى {z.max_distance_km} كم
              </span>
            </span>
            <span className="text-sm font-semibold text-m-accent">{money(Number(z.fee))}</span>
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل منطقة" : "منطقة جديدة"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_zones", draft.id!);
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
              placeholder="اسم المنطقة"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">رسوم التوصيل</span>
              <input
                className={`${mField} mark`}
                inputMode="decimal"
                value={String(draft.fee ?? 0)}
                onChange={(e) => setDraft({ ...draft, fee: num(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">أقصى مسافة (كم)</span>
              <input
                className={`${mField} mark`}
                inputMode="decimal"
                value={String(draft.max_distance_km ?? 0)}
                onChange={(e) => setDraft({ ...draft, max_distance_km: num(e.target.value) })}
              />
            </label>
          </div>
        )}
      </MSheet>
    </div>
  );
}
