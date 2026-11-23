"use client";

import { useState } from "react";
import type { Order } from "../matam/types";
import { updateOrder } from "../matam/db";
import { mField, mGhost, mPrimary } from "../matam/ui";

/**
 * تقييم بعد التسليم.
 * يُسأل مرة واحدة، ولا يُلحّ: من تجاهله لا يُسأل ثانية عن الطلب نفسه.
 */
export function Rating({ order, onDone }: { order: Order; onDone: () => void }) {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (order.status !== "delivered" || order.rating !== null) return null;

  const send = async (value: number) => {
    setBusy(true);
    await updateOrder(order.id, { rating: value, rating_note: note.trim() || null });
    setBusy(false);
    onDone();
  };

  return (
    <section className="mx-4 mb-4 flex flex-col gap-3 rounded-2xl border border-m-line bg-m-surface p-4">
      <h3 className="text-sm font-semibold">كيف كان طلبك؟</h3>

      <div className="flex justify-center gap-1.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setStars(n)}
            aria-label={`${n} من 5`}
            className="p-1 transition-transform active:scale-90"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-7"
              fill={n <= stars ? "var(--m-warn)" : "none"}
              stroke={n <= stars ? "var(--m-warn)" : "var(--m-faint)"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z" />
            </svg>
          </button>
        ))}
      </div>

      {stars > 0 && (
        <>
          <input
            className={mField}
            placeholder="ملاحظة (اختياري)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => void send(stars)}
              className={`${mPrimary} flex-1`}
            >
              {busy ? "…" : "أرسل التقييم"}
            </button>
            <button onClick={onDone} className={mGhost}>
              لاحقًا
            </button>
          </div>
        </>
      )}
    </section>
  );
}
