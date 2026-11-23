"use client";

import { useSyncExternalStore } from "react";
import type { CartLine, ChosenOption, Item } from "./types";

/**
 * السلة في مخزن خارجي يُحفظ محليًا.
 * خارج React لأن عدة شاشات تقرأها وتكتب فيها، وفقدانها عند تحديث
 * الصفحة تجربة سيئة في تطبيق طلبات.
 */

const KEY = "matam.cart";

let lines: CartLine[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: CartLine[] = [];

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* التخزين ممنوع — تبقى السلة في الذاكرة */
  }
  for (const fn of listeners) fn();
}

function snapshot(): CartLine[] {
  if (!loaded) {
    try {
      const raw = localStorage.getItem(KEY);
      lines = raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      lines = [];
    }
    loaded = true;
  }
  return lines;
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/**
 * مفتاح يجمع الصنف مع خياراته، فيُدمج المتطابق ويُفصل المختلف.
 *
 * الكمّية جزء من المفتاح لا الاسم وحده: «صوص ×٢» و«صوص ×٣» لهما
 * السعر نفسه في الاسم ويختلفان في المال. وكانا يُدمجان في سطر
 * واحد بسعر أوّلهما، فيخسر المطعم الفرق أو يدفعه الزبون ظلمًا.
 * والترتيب يُوحَّد بالاسم قبل الضمّ، فلا يفرّق المفتاحَ ترتيبُ
 * الاختيار.
 */
function lineKey(itemId: string, options: ChosenOption[], note: string | null) {
  const sig = options
    .map((o) => {
      const pairs = o.names
        .map((n, i) => `${n}*${o.quantities?.[i] ?? 1}`)
        .sort()
        .join("|");
      return `${o.group_id}:${pairs}`;
    })
    .sort()
    .join(";");
  return `${itemId}#${sig}#${note ?? ""}`;
}

export function addToCart(
  item: Item,
  options: ChosenOption[],
  quantity: number,
  note: string | null,
) {
  const extras = options.reduce((s, o) => s + o.extra, 0);
  const base = item.exclude_base_price ? 0 : discounted(item);
  const unit = base + extras;
  const key = lineKey(item.id, options, note);

  snapshot();
  const found = lines.find((l) => l.key === key);
  if (found) found.quantity += quantity;
  else
    lines = [
      ...lines,
      {
        key,
        item_id: item.id,
        name: item.name,
        unit_price: unit,
        quantity,
        image_url: item.image_url,
        options,
        note,
      },
    ];
  persist();
}

export function setQuantity(key: string, quantity: number) {
  snapshot();
  lines =
    quantity <= 0
      ? lines.filter((l) => l.key !== key)
      : lines.map((l) => (l.key === key ? { ...l, quantity } : l));
  persist();
}

export function clearCart() {
  lines = [];
  loaded = true;
  persist();
}

/** السعر بعد الخصم إن وُجد */
export function discounted(item: Item): number {
  const d = item.discount_percent ?? 0;
  return d > 0 ? Math.round(item.price * (1 - d / 100) * 100) / 100 : item.price;
}

export function useCart() {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const count = list.reduce((s, l) => s + l.quantity, 0);
  const subtotal = list.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  return { lines: list, count, subtotal, setQty: setQuantity, clear: clearCart };
}
