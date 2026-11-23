"use client";

import { useMemo, useState } from "react";
import type { Banner, Category, Combo, Item, Settings } from "../matam/types";
import { discounted } from "../matam/cart";
import { money } from "../matam/format";
import { Empty } from "../matam/ui";
import { Badge, Photo, SearchField } from "./visuals";

export function Menu({
  settings,
  categories,
  items,
  combos,
  banners,
  onOpenItem,
  onOpenCombo,
}: {
  settings: Settings | null;
  categories: Category[];
  items: Item[];
  combos: Combo[];
  banners: Banner[];
  onOpenItem: (item: Item) => void;
  onOpenCombo: (combo: Combo) => void;
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const cats = categories.filter((c) => c.is_active);
  const shownBanners = banners.filter((b) => b.is_active);
  const activeCombos = combos.filter((c) => c.is_active);
  const featured = items.filter((i) => i.is_best_seller && i.is_available).slice(0, 6);

  const visible = useMemo(() => {
    const q = query.trim();
    return items.filter((i) => {
      if (active !== "all" && i.category_id !== active) return false;
      if (!q) return true;
      return i.name.includes(q) || i.description.includes(q);
    });
  }, [items, active, query]);

  const closed = settings && (!settings.is_open || !settings.allow_orders);
  const plain = !query && active === "all";

  return (
    <div className="flex flex-col pb-8">
      {closed && (
        <p className="bg-m-danger px-4 py-2.5 text-center text-xs font-medium text-white">
          المطعم مغلق الآن — يمكنك التصفّح دون طلب
        </p>
      )}

      <div className="sticky top-0 z-10 bg-m-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <SearchField value={query} onChange={setQuery} />
      </div>

      {plain && shownBanners.length > 0 && (
        <div className="m-noscroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {shownBanners.map((b) => (
            <Photo
              key={b.id}
              src={b.image_url}
              alt=""
              className="h-40 w-[19rem] snap-center rounded-3xl shadow-m"
            />
          ))}
        </div>
      )}

      {cats.length > 0 && (
        <div className="m-noscroll mt-5 flex gap-2 overflow-x-auto px-4">
          {[{ id: "all", name: "الكل" }, ...cats].map((c) => {
            const on = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition-all ${
                  on
                    ? "bg-m-accent font-bold text-white shadow-m"
                    : "bg-m-surface font-medium text-m-dim shadow-m-sm hover:text-m-text"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {plain && featured.length > 0 && (
        <section className="mt-7">
          <h2 className="px-4 pb-3 text-[17px] font-bold">الأكثر طلبًا</h2>
          <div className="m-noscroll flex gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((it) => (
              <button
                key={it.id}
                onClick={() => onOpenItem(it)}
                className="w-44 shrink-0 overflow-hidden rounded-3xl bg-m-surface text-start shadow-m transition-transform active:scale-[0.98]"
              >
                <Photo src={it.image_url} alt={it.name} className="h-32 w-full" />
                <div className="flex flex-col gap-1 p-3">
                  <span className="truncate text-[13px] font-semibold">{it.name}</span>
                  <span className="text-[15px] font-bold text-m-accent">
                    {money(discounted(it))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {plain && activeCombos.length > 0 && (
        <section className="mt-7">
          <h2 className="px-4 pb-3 text-[17px] font-bold">وجبات مركّبة</h2>
          <div className="flex flex-col gap-3 px-4">
            {activeCombos.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenCombo(c)}
                className="relative overflow-hidden rounded-3xl bg-m-surface text-start shadow-m transition-transform active:scale-[0.99]"
              >
                <Photo src={c.image_url} alt={c.name} className="h-36 w-full" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent p-4">
                  <span className="text-[15px] font-bold text-white">{c.name}</span>
                  <span className="rounded-full bg-white/95 px-3 py-1 text-[13px] font-bold text-m-accent-deep">
                    {money(Number(c.price))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 flex flex-col gap-3 px-4">
        {plain && visible.length > 0 && <h2 className="text-[17px] font-bold">كل الأصناف</h2>}

        {visible.length === 0 ? (
          <Empty
            title="لا توجد أصناف"
            hint={query ? "جرّب كلمة أخرى" : "ستظهر هنا فور إضافتها"}
          />
        ) : (
          visible.map((item) => {
            const off = (item.discount_percent ?? 0) > 0;
            return (
              <button
                key={item.id}
                onClick={() => onOpenItem(item)}
                disabled={!item.is_available}
                className="flex gap-3.5 rounded-3xl bg-m-surface p-3 text-start shadow-m-sm transition-all enabled:hover:shadow-m enabled:active:scale-[0.99] disabled:opacity-55"
              >
                <Photo src={item.image_url} alt={item.name} className="size-24 rounded-2xl" />

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span className="line-clamp-1 flex-1 text-[15px] font-semibold leading-snug">
                        {item.name}
                      </span>
                      {item.is_new && <Badge tone="var(--m-info)">جديد</Badge>}
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-m-dim">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[17px] font-bold text-m-accent">
                      {money(discounted(item))}
                    </span>
                    {off && (
                      <span className="text-xs text-m-faint line-through">{money(item.price)}</span>
                    )}
                    {!item.is_available && (
                      <span className="ms-auto text-[11px] font-medium text-m-danger">
                        غير متوفر
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}
