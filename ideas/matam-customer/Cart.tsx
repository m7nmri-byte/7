"use client";

import { useCart } from "../matam/cart";
import { money } from "../matam/format";
import { Empty, mPrimary } from "../matam/ui";

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

  return (
    <div className="flex flex-col gap-3 p-4">
      {lines.map((l) => (
        <article
          key={l.key}
          className="flex gap-3 rounded-2xl border border-m-line bg-m-surface p-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{l.name}</span>

            {l.options.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-[11px] text-m-dim">
                {l.options.map((o) => (
                  <li key={o.group_id} className="truncate">
                    {o.group_name}: {o.names.join("، ")}
                  </li>
                ))}
              </ul>
            )}

            {l.note && <p className="truncate text-[11px] text-m-faint">ملاحظة: {l.note}</p>}

            <span className="text-sm font-semibold text-m-accent">
              {money(l.unit_price * l.quantity)}
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-between">
            <button
              onClick={() => setQty(l.key, 0)}
              aria-label="احذف"
              className="p-1 text-m-faint hover:text-m-danger"
            >
              ✕
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-m-line">
              <button
                onClick={() => setQty(l.key, l.quantity - 1)}
                className="px-2 py-1 text-m-dim"
                aria-label="أنقص"
              >
                −
              </button>
              <span className="mark w-5 text-center text-xs tabular-nums">{l.quantity}</span>
              <button
                onClick={() => setQty(l.key, l.quantity + 1)}
                className="px-2 py-1 text-m-dim"
                aria-label="زد"
              >
                +
              </button>
            </div>
          </div>
        </article>
      ))}

      <dl className="mt-2 flex flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-m-dim">المجموع</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">التوصيل</dt>
          <dd>{deliveryFee > 0 ? money(deliveryFee) : "يُحدَّد عند اختيار المنطقة"}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-m-line pt-2 font-semibold">
          <dt>الإجمالي</dt>
          <dd className="text-m-accent">{money(subtotal + deliveryFee)}</dd>
        </div>
      </dl>

      {belowMin && (
        <p className="text-center text-xs text-m-warn">
          الحد الأدنى للطلب {money(minOrder)} — أضف {money(minOrder - subtotal)} لتتمكن من الإتمام
        </p>
      )}

      <button
        onClick={onCheckout}
        disabled={belowMin || !canOrder}
        className={`${mPrimary} mt-1`}
      >
        {canOrder ? "متابعة الطلب" : "الطلب متوقف الآن"}
      </button>
    </div>
  );
}
