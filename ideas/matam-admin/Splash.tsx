"use client";

import { useState } from "react";
import { remove, upsert } from "../matam/db";
import { ImageField } from "../matam/ImageField";
import { Empty, MSheet, mDanger, mGhost, mPrimary } from "../matam/ui";
import type { Splash as SplashImage } from "./theme-core";

export function Splash({
  images,
  onChanged,
}: {
  images: SplashImage[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<SplashImage> | null>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
      <button
        onClick={() => setDraft({ image_url: "", sort_order: images.length, is_active: true })}
        className={mPrimary}
      >
        + صورة بداية
      </button>

      {images.length === 0 ? (
        <Empty title="لا صور" hint="تظهر لحظة فتح تطبيق العميل" />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((sp) => (
            <button
              key={sp.id}
              onClick={() => setDraft(sp)}
              className="relative aspect-[9/16] overflow-hidden rounded-xl border border-m-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sp.image_url} alt="" className="size-full object-cover" />
              {!sp.is_active && (
                <span className="absolute inset-0 grid place-items-center bg-black/55 text-[10px] text-white">
                  مخفية
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل صورة" : "صورة بداية"}
        footer={
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!draft?.image_url?.trim()) return;
                await upsert("matam_splash", {
                  ...(draft.id ? { id: draft.id } : {}),
                  image_url: draft.image_url,
                  sort_order: Number(draft.sort_order ?? 0),
                  is_active: draft.is_active ?? true,
                });
                setDraft(null);
                onChanged();
              }}
              className={`${mPrimary} flex-1`}
            >
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_splash", draft.id!);
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
              value={draft.image_url || null}
              onChange={(url) => setDraft({ ...draft, image_url: url ?? "" })}
              folder="matam/splash"
              label="الصورة"
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
