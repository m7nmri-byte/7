"use client";

import { useCart } from "../matam/cart";
import { money } from "../matam/format";
import { Empty } from "../matam/ui";
import { Photo } from "./visuals";

export function Cart({
  deliveryFee,
  minOrder,
  canOrder,
  onCheckout,
}: {
  deliveryFee: number;
  minOrder: number;
  canOrder: boolean;
  onCheckout: () => void;
}) {
  const { lines, subtotal, setQty } = useCart();

  if (!lines.length)
    return <Empty title="سلّتك فارغة" hint="تصفّح القائمة وأضف ما يعجبك" />;

  const belowMin = minOrder > 0 && subtotal < minOrder;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      {lines.map((l) => (
        <article
          key={l.key}
          className="flex gap-3 rounded-3xl bg-m-surface p-3 shadow-m-sm"
        >
          <Photo src={l.image_url} alt={l.name} className="size-20 rounded-2xl" />

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2">
                <span className="line-clamp-1 flex-1 text-[15px] font-semibold">{l.name}</span>
                <button
                  onClick={() => setQty(l.key, 0)}
                  aria-label="احذف"
                  className="shrink-0 p-0.5 text-m-faint transition-colors hover:text-m-danger"
                >
                  ✕
                </button>
              </div>

              {l.options.map((o) => (
                <span key={o.group_id} className="truncate text-[11px] text-m-dim">
                  {o.group_name}: {o.names.join("، ")}
                </span>
              ))}
              {l.note && <span className="truncate text-[11px] text-m-faint">{l.note}</span>}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5">
              <span className="text-[16px] font-bold text-m-accent">
                {money(l.unit_price * l.quantity)}
              </span>

              <div className="flex items-center overflow-hidden rounded-full bg-m-raised">
                <button
                  onClick={() => setQty(l.key, l.quantity - 1)}
                  className="px-3 py-1.5 text-m-dim transition-colors hover:text-m-accent"
                  aria-label="أنقص"
                >
                  −
                </button>
                <span className="mark w-6 text-center text-[13px] font-bold tabular-nums">
                  {l.quantity}
                </span>
                <button
                  onClick={() => setQty(l.key, l.quantity + 1)}
                  className="px-3 py-1.5 text-m-dim transition-colors hover:text-m-accent"
                  aria-label="زد"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}

      <dl className="mt-2 flex flex-col gap-2.5 rounded-3xl bg-m-surface p-4 text-sm shadow-m-sm">
        <div className="flex justify-between">
          <dt className="text-m-dim">المجموع</dt>
          <dd className="font-medium">{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">التوصيل</dt>
          <dd className="font-medium">
            {deliveryFee > 0 ? money(deliveryFee) : "يُحدَّد لاحقًا"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-m-line-soft pt-3">
          <dt className="font-semibold">الإجمالي</dt>
          <dd className="text-[20px] font-bold text-m-accent">{money(total)}</dd>
        </div>
      </dl>

      {belowMin && (
        <p className="rounded-2xl bg-m-accent-soft px-4 py-3 text-center text-xs font-medium text-m-accent-deep">
          الحد الأدنى {money(minOrder)} — أضف {money(minOrder - subtotal)} للمتابعة
        </p>
      )}

      <button
        onClick={onCheckout}
        disabled={belowMin || !canOrder}
        className="mt-1 rounded-2xl bg-m-accent py-4 text-[15px] font-bold text-white shadow-m transition-all active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
      >
        {canOrder ? "متابعة الطلب" : "الطلب متوقف الآن"}
      </button>
    </div>
  );
}
