"use client";

import { useMemo, useState } from "react";
import type { Category, Combo, Item, Settings } from "../matam/types";
import { discounted } from "../matam/cart";
import { money } from "../matam/format";
import { Chip, Empty } from "../matam/ui";

function Price({ item }: { item: Item }) {
  const off = (item.discount_percent ?? 0) > 0;
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-sm font-semibold text-m-accent">{money(discounted(item))}</span>
      {off && (
        <span className="text-xs text-m-faint line-through">{money(item.price)}</span>
      )}
    </span>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src)
    return (
      <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-m-raised text-m-faint">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M4 7h16v12H4z" />
          <path d="M4 15l4-4 3 3 3-3 6 6" />
        </svg>
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />
  );
}

export function Menu({
  settings,
  categories,
  items,
  combos,
  onOpenItem,
  onOpenCombo,
}: {
  settings: Settings | null;
  categories: Category[];
  items: Item[];
  combos: Combo[];
  onOpenItem: (item: Item) => void;
  onOpenCombo: (combo: Combo) => void;
}) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");

  const cats = categories.filter((c) => c.is_active);

  const visible = useMemo(() => {
    const q = query.trim();
    return items.filter((i) => {
      if (active !== "all" && i.category_id !== active) return false;
      if (!q) return true;
      return i.name.includes(q) || i.description.includes(q);
    });
  }, [items, active, query]);

  const activeCombos = combos.filter((c) => c.is_active);
  const closed = settings && (!settings.is_open || !settings.allow_orders);

  return (
    <div className="flex flex-col">
      {closed && (
        <div className="bg-m-danger/15 px-4 py-2.5 text-center text-xs text-m-danger">
          المطعم مغلق الآن — يمكنك التصفّح دون طلب
        </div>
      )}

      {settings?.welcome_message && (
        <p className="px-4 pt-4 text-sm text-m-dim">{settings.welcome_message}</p>
      )}

      <div className="px-4 pt-4">
        <input
          className="w-full rounded-xl border border-m-line bg-m-raised px-3 py-2.5 text-sm text-m-text outline-none placeholder:text-m-faint focus:border-m-accent/60"
          placeholder="ابحث في القائمة"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {cats.length > 0 && (
        <div className="m-noscroll mt-4 flex gap-2 overflow-x-auto px-4">
          <button
            onClick={() => setActive("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${
              active === "all"
                ? "bg-m-accent font-semibold text-[#1a1204]"
                : "border border-m-line text-m-dim"
            }`}
          >
            الكل
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${
                active === c.id
                  ? "bg-m-accent font-semibold text-[#1a1204]"
                  : "border border-m-line text-m-dim"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {active === "all" && activeCombos.length > 0 && !query && (
        <section className="mt-5">
          <h2 className="px-4 pb-2 text-xs font-semibold text-m-dim">وجبات مركّبة</h2>
          <div className="m-noscroll flex gap-3 overflow-x-auto px-4 pb-1">
            {activeCombos.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenCombo(c)}
                className="flex w-44 shrink-0 flex-col gap-2 rounded-2xl border border-m-line bg-m-surface p-3 text-start"
              >
                <Thumb src={c.image_url} alt={c.name} />
                <span className="truncate text-sm font-medium">{c.name}</span>
                <span className="text-sm font-semibold text-m-accent">{money(c.price)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 flex flex-col gap-2 px-4 pb-6">
        {visible.length === 0 ? (
          <Empty title="لا توجد أصناف" hint={query ? "جرّب كلمة أخرى" : "ستظهر هنا فور إضافتها"} />
        ) : (
          visible.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenItem(item)}
              disabled={!item.is_available}
              className="flex items-center gap-3 rounded-2xl border border-m-line bg-m-surface p-3 text-start transition-colors enabled:hover:border-m-accent/40 disabled:opacity-50"
            >
              <Thumb src={item.image_url} alt={item.name} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  {item.is_new && <Chip color="var(--m-info)">جديد</Chip>}
                  {item.is_best_seller && <Chip color="var(--m-accent)">الأكثر طلبًا</Chip>}
                </div>
                {item.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-m-dim">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Price item={item} />
                  {!item.is_available && <span className="text-[11px] text-m-danger">غير متوفر</span>}
                </div>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
