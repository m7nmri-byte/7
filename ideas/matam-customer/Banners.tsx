"use client";

import { useRef, useState } from "react";
import type { Banner, Category, Item } from "../matam/types";

/**
 * شريط اللافتات.
 *
 * كل لافتة بعرض الشاشة لا بعرضٍ ثابت: اللافتة الواحدة كانت تُحبس في
 * ٢٨٨ بكسل فتلتصق بحافّة وتترك فراغًا ميّتًا بجانبها.
 *
 * والنسبة ١٦:٧ قريبة ممّا تُصمَّم عليه صور العروض، فيبقى نصّها داخل
 * الإطار. وobject-cover على نسبةٍ بعيدة يقصّ الأعلى والأسفل — وفيهما
 * رقم الهاتف والعرض عادةً.
 */
export function Banners({
  banners,
  categories,
  items,
  onCategory,
  onOpenItem,
}: {
  banners: Banner[];
  categories: Category[];
  items: Item[];
  onCategory: (id: string) => void;
  onOpenItem: (item: Item) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  const list = banners.filter((b) => b.is_active);
  if (list.length === 0) return null;

  /** الظاهرة تُحسب من موضع السحب وعرض الإطار، فلا يلزم مراقب تقاطع */
  const onScroll = () => {
    const el = box.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const i = Math.round(Math.abs(el.scrollLeft) / w);
    if (i !== at) setAt(Math.min(list.length - 1, Math.max(0, i)));
  };

  const goTo = (i: number) => {
    const el = box.current;
    if (!el) return;
    /** RTL يجعل scrollLeft سالبًا في أكثر المتصفّحات، فتُقاس الإشارة */
    const sign = el.scrollLeft <= 0 ? -1 : 1;
    el.scrollTo({ left: sign * i * el.clientWidth, behavior: "smooth" });
  };

  const target = (b: Banner) => {
    if (b.link_type === "category" && b.link_id) {
      const c = categories.find((x) => x.id === b.link_id);
      return c ? () => onCategory(c.id) : null;
    }
    if (b.link_type === "item" && b.link_id) {
      const it = items.find((x) => x.id === b.link_id);
      return it ? () => onOpenItem(it) : null;
    }
    return null;
  };

  return (
    <section className="flex flex-col gap-2 px-4 pt-4">
      <div
        ref={box}
        onScroll={onScroll}
        className="m-noscroll flex snap-x snap-mandatory gap-3 overflow-x-auto"
      >
        {list.map((b, i) => {
          const go = target(b);
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.image_url}
              alt=""
              /** الأولى تُحمَّل فورًا: هي أبرز ما في الشاشة، وتأخيرها يُرى */
              loading={i === 0 ? "eager" : "lazy"}
              className="size-full object-cover"
            />
          );
          const shell =
            "aspect-[16/7] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-m-raised";
          return go ? (
            <button key={b.id} onClick={go} className={shell}>
              {img}
            </button>
          ) : (
            <div key={b.id} className={shell}>
              {img}
            </div>
          );
        })}
      </div>

      {/* نقاط تقول إنّ خلفها غيرها، فلا يظنّها الزبون واحدة */}
      {list.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {list.map((b, i) => (
            <button
              key={b.id}
              onClick={() => goTo(i)}
              aria-label={"لافتة " + (i + 1)}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === at ? "w-5 bg-m-accent" : "w-1.5 bg-m-line")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
