import type { Order } from "../matam/types";

export type AppUser = {
  id: string;
  phone: string;
  name: string;
  role: "customer" | "kitchen" | "driver" | "admin";
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
};

export const ROLES: { key: AppUser["role"]; label: string }[] = [
  { key: "customer", label: "عميل" },
  { key: "kitchen", label: "مطبخ" },
  { key: "driver", label: "مندوب" },
  { key: "admin", label: "إدارة" },
];

export type UserStats = { count: number; spent: number; last: string };

/**
 * إحصاء كل زبون من طلباته مباشرة.
 * البديل — عمود يُحدَّث مع كل طلب — يتعفّن عند أول تعديل يدوي،
 * والطلبات هي المصدر الذي لا يكذب.
 */
export function statsByPhone(orders: Order[]): Map<string, UserStats> {
  const map = new Map<string, UserStats>();
  for (const o of orders) {
    const key = o.customer_phone.trim();
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, spent: 0, last: o.created_at };
    cur.count++;
    if (o.status === "delivered") cur.spent += Number(o.total);
    if (o.created_at > cur.last) cur.last = o.created_at;
    map.set(key, cur);
  }
  return map;
}

/** زبائن ظهروا في الطلبات ولا سجلّ لهم — يُعرضون ليُضافوا بضغطة */
export function unknownCustomers(users: AppUser[], orders: Order[]) {
  const known = new Set(users.map((u) => u.phone));
  const seen = new Map<string, string>();
  for (const o of orders) {
    const p = o.customer_phone.trim();
    if (p && !known.has(p) && !seen.has(p)) seen.set(p, o.customer_name);
  }
  return [...seen.entries()].map(([phone, name]) => ({ phone, name }));
}
