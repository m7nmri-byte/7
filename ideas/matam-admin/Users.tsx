"use client";

import { useMemo, useState } from "react";
import type { Order } from "../matam/types";
import { money } from "../matam/format";
import { Empty, mField, mPrimary } from "../matam/ui";
import { ROLES, statsByPhone, unknownCustomers, type AppUser } from "./users-core";
import { UserSheet } from "./UserSheet";

export function Users({
  users,
  orders,
  onChanged,
}: {
  users: AppUser[];
  orders: Order[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | AppUser["role"]>("all");
  const [draft, setDraft] = useState<Partial<AppUser> | null>(null);

  const stats = useMemo(() => statsByPhone(orders), [orders]);
  const unknown = useMemo(() => unknownCustomers(users, orders), [users, orders]);

  const list = users.filter((u) => {
    if (role !== "all" && u.role !== role) return false;
    const q = query.trim();
    return !q || u.name.includes(q) || u.phone.includes(q);
  });

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 border-b border-m-line p-4">
        <input
          className={mField}
          placeholder="بحث بالاسم أو الجوال"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="m-noscroll flex gap-2 overflow-x-auto">
          {[{ key: "all" as const, label: "الكل" }, ...ROLES].map((r) => {
            const n =
              r.key === "all" ? users.length : users.filter((u) => u.role === r.key).length;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                  role === r.key
                    ? "bg-m-accent font-semibold text-white"
                    : "border border-m-line text-m-dim"
                }`}
              >
                {r.label} {n > 0 ? <span className="mark">{n}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <button
          onClick={() => setDraft({ phone: "", name: "", role: "customer" })}
          className={mPrimary}
        >
          + مستخدم جديد
        </button>

        {list.length === 0 && unknown.length === 0 && (
          <Empty title="لا مستخدمين" hint="يظهرون هنا مع أول طلب" />
        )}

        {list.map((u) => {
          const st = stats.get(u.phone);
          return (
            <button
              key={u.id}
              onClick={() => setDraft(u)}
              className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {u.name || "بلا اسم"}
                  {u.is_blocked && (
                    <span className="ms-2 text-[11px] text-m-danger">محظور</span>
                  )}
                </span>
                <span className="mark text-[11px] text-m-faint" dir="ltr">
                  {u.phone}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px]">
                <span className="text-m-dim">{ROLES.find((r) => r.key === u.role)?.label}</span>
                {st && (
                  <span className="text-m-faint">
                    {st.count} طلب · {money(st.spent)}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {unknown.length > 0 && (
          <section className="mt-3 flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-m-dim">
              زبائن من الطلبات بلا سجلّ ({unknown.length})
            </h3>
            {unknown.slice(0, 20).map((u) => {
              const st = stats.get(u.phone);
              return (
                <button
                  key={u.phone}
                  onClick={() => setDraft({ phone: u.phone, name: u.name, role: "customer" })}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-m-line p-3 text-start"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{u.name || "بلا اسم"}</span>
                    <span className="mark text-[11px] text-m-faint" dir="ltr">
                      {u.phone}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-m-accent">
                    {st ? `${st.count} طلب · ` : ""}أضف
                  </span>
                </button>
              );
            })}
          </section>
        )}
      </div>

      <UserSheet
        draft={draft}
        stats={draft?.phone ? (stats.get(draft.phone) ?? null) : null}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSaved={onChanged}
      />
    </div>
  );
}
