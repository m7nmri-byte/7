"use client";

import { useState } from "react";
import type { PopupAd } from "../matam/types";
import { remove, upsert } from "../matam/db";
import { Empty, MSheet, mDanger, mField, mGhost, mPrimary } from "../matam/ui";

const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;

export function Ads({ ads, onChanged }: { ads: PopupAd[]; onChanged: () => void }) {
  const [draft, setDraft] = useState<Partial<PopupAd> | null>(null);

  const save = async () => {
    const urls = (draft?.image_urls ?? []).map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    await upsert("matam_popup_ads", {
      ...(draft?.id ? { id: draft.id } : {}),
      image_urls: urls,
      caption: draft?.caption ?? null,
      is_active: draft?.is_active ?? true,
      sort_order: Number(draft?.sort_order ?? 0),
      auto_scroll: draft?.auto_scroll ?? true,
      auto_scroll_seconds: Number(draft?.auto_scroll_seconds ?? 5),
      link_type: draft?.link_type ?? "none",
      link_id: draft?.link_id ?? null,
      external_url: draft?.external_url ?? null,
    });
    setDraft(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() =>
          setDraft({
            image_urls: [""],
            is_active: true,
            auto_scroll: true,
            auto_scroll_seconds: 5,
            sort_order: 0,
          })
        }
        className={mPrimary}
      >
        + إعلان جديد
      </button>

      {ads.length === 0 ? (
        <Empty title="لا إعلانات" hint="تظهر مرة واحدة عند فتح تطبيق العميل" />
      ) : (
        ads.map((a) => (
          <button
            key={a.id}
            onClick={() => setDraft(a)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{a.caption || "بلا عنوان"}</span>
              <span className="text-[11px] text-m-faint">{a.image_urls.length} صورة</span>
            </span>
            {!a.is_active && <span className="shrink-0 text-[11px] text-m-faint">مخفي</span>}
          </button>
        ))
      )}

      <MSheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل إعلان" : "إعلان جديد"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void save()} className={`${mPrimary} flex-1`}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  await remove("matam_popup_ads", draft.id!);
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
              value={draft.caption ?? ""}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value || null })}
              placeholder="العنوان"
            />

            {(draft.image_urls ?? []).map((u, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${mField} mark`}
                  dir="ltr"
                  value={u}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      image_urls: (draft.image_urls ?? []).map((x, k) =>
                        k === i ? e.target.value : x,
                      ),
                    })
                  }
                  placeholder="https://…"
                />
                <button
                  onClick={() =>
                    setDraft({
                      ...draft,
                      image_urls: (draft.image_urls ?? []).filter((_, k) => k !== i),
                    })
                  }
                  aria-label="احذف"
                  className="px-2 text-m-faint hover:text-m-danger"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() =>
                setDraft({ ...draft, image_urls: [...(draft.image_urls ?? []), ""] })
              }
              className="self-start text-xs text-m-accent"
            >
              + صورة
            </button>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">رابط خارجي عند الضغط</span>
              <input
                className={`${mField} mark`}
                dir="ltr"
                value={draft.external_url ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    external_url: e.target.value || null,
                    link_type: e.target.value ? "external" : "none",
                  })
                }
                placeholder="اختياري"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setDraft({ ...draft, auto_scroll: !(draft.auto_scroll ?? true) })}
                className={`${mGhost} flex-1 py-2 text-xs`}
              >
                {draft.auto_scroll ?? true ? "تمرير تلقائي" : "تمرير يدوي"}
              </button>
              <input
                className={`${mField} mark w-20 py-2 text-center text-xs`}
                inputMode="numeric"
                value={String(draft.auto_scroll_seconds ?? 5)}
                onChange={(e) =>
                  setDraft({ ...draft, auto_scroll_seconds: num(e.target.value) || 5 })
                }
              />
            </div>

            <button
              onClick={() => setDraft({ ...draft, is_active: !(draft.is_active ?? true) })}
              className={mGhost}
            >
              {draft.is_active ?? true ? "ظاهر" : "مخفي"}
            </button>
          </div>
        )}
      </MSheet>
    </div>
  );
}
