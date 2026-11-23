"use client";

import { useState } from "react";
import type { Banner } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";
import { ImageField } from "../matam/ImageField";

export function Banners({
  banners,
  onChanged,
}: {
  banners: Banner[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Banner> | null>(null);

  const save = async () => {
    if (!draft?.image_url?.trim()) return;
    await upsert("matam_banners", {
      ...(draft.id ? { id: draft.id } : {}),
      image_url: draft.image_url.trim(),
      sort_order: Number(draft.sort_order ?? 0),
      is_active: draft.is_active ?? true,
      link_type: draft.link_type ?? "none",
      link_id: draft.link_id ?? null,
    });
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => setDraft({ image_url: "", is_active: true, sort_order: 0 })}
        className={mPrimary}
      >
        + لافتة جديدة
      </button>

      {banners.length === 0 ? (
        <Empty title="لا لافتات" hint="تظهر أعلى قائمة الزبون" />
      ) : (
        banners.map((b) => (
          <button
            key={b.id}
            onClick={() => setDraft(b)}
            className="overflow-hidden rounded-xl border border-m-line bg-m-surface text-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt="" className="h-24 w-full object-cover" />
            <span className="flex items-center justify-between px-3 py-2 text-[11px] text-m-faint">
              <span className="mark">ترتيب {b.sort_order}</span>
              {!b.is_active && <span>مخفية</span>}
            </span>
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل لافتة" : "لافتة جديدة"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_banners", draft.id!);
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
            <ImageField
              value={draft.image_url ?? null}
              onChange={(url) => setDraft({ ...draft, image_url: url ?? "" })}
              folder="matam/banners"
              label="صورة اللافتة"
            />
            <input
              className={`${mField} mark`}
              inputMode="numeric"
              value={String(draft.sort_order ?? 0)}
              onChange={(e) =>
                setDraft({ ...draft, sort_order: Number(e.target.value.replace(/\D/g, "")) || 0 })
              }
              placeholder="الترتيب"
            />
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
