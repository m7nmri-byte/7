"use client";

import { useState } from "react";
import type { Department, Member, Shift } from "../types";
import { ROLE_LABEL } from "../types";
import { fmtDate } from "../format";
import { setMe, useMe } from "../hooks";
import { Empty, Tag, jField, jPrimary } from "../ui";
import { MemberForm } from "./MemberForm";

export function Members({
  members,
  departments,
  shifts,
  onChanged,
}: {
  members: Member[];
  departments: Department[];
  shifts: Shift[];
  onChanged: () => void;
}) {
  const me = useMe();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [draft, setDraft] = useState<Partial<Member> | null>(null);

  const list = members.filter((m) => {
    if (dept !== "all" && m.department_id !== dept) return false;
    const q = query.trim();
    return !q || m.name.includes(q) || (m.phone ?? "").includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${jField} max-w-xs`}
          placeholder="بحث بالاسم أو الجوال"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${jField} max-w-48`}
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          <option value="all">كل الإدارات</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setDraft({ role: "member", is_active: true, annual_leave_days: 21 })}
          className={`${jPrimary} ms-auto`}
        >
          + موظف
        </button>
      </div>

      {list.length === 0 ? (
        <Empty title="لا موظفين" hint="أضف أول موظف لتبدأ" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <article
              key={m.id}
              className="flex items-start gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-j-brand-soft text-sm font-bold text-j-brand">
                {m.name.charAt(0)}
              </span>

              <button
                onClick={() => setDraft(m)}
                className="flex min-w-0 flex-1 flex-col gap-0.5 text-start"
              >
                <span className="truncate text-sm font-semibold">
                  {m.name}
                  {!m.is_active && <span className="ms-2 text-[11px] text-j-faint">موقوف</span>}
                </span>
                <span className="truncate text-xs text-j-dim">{m.job_title ?? "—"}</span>
                <span className="truncate text-[11px] text-j-faint">
                  {departments.find((d) => d.id === m.department_id)?.name ?? "بلا إدارة"}
                  {m.hired_at ? ` · منذ ${fmtDate(m.hired_at)}` : ""}
                </span>
              </button>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Tag tone={m.role === "admin" ? "var(--j-brand)" : undefined}>
                  {ROLE_LABEL[m.role]}
                </Tag>
                <button
                  onClick={() => setMe(m.id)}
                  className={`text-[11px] ${
                    me === m.id ? "font-semibold text-j-brand" : "text-j-faint hover:text-j-text"
                  }`}
                >
                  {me === m.id ? "أنا" : "ادخل باسمه"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <MemberForm
        draft={draft}
        members={members}
        departments={departments}
        shifts={shifts}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSaved={onChanged}
      />
    </div>
  );
}
