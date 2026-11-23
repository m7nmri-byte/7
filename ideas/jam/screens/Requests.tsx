"use client";

import { useMemo, useState } from "react";
import type { Chain, Member, Request } from "../types";
import { REQUEST_STATUS } from "../types";
import { money, sinceText } from "../format";
import { useMe } from "../hooks";
import { Empty, Tag, jPrimary } from "../ui";
import { PRIORITY, STATUS_TONE, awaitsMe } from "./request-core";
import { RequestSheet } from "./RequestSheet";
import { RequestForm } from "./RequestForm";

const SCOPES = [
  ["inbox", "عندي للمراجعة"],
  ["mine", "طلباتي"],
  ["all", "الكل"],
] as const;

export function Requests({
  requests,
  members,
  chains,
  onChanged,
}: {
  requests: Request[];
  members: Member[];
  chains: Chain[];
  onChanged: () => void;
}) {
  const me = useMe();
  const [scope, setScope] = useState<(typeof SCOPES)[number][0]>("inbox");
  const [open, setOpen] = useState<Request | null>(null);
  const [draft, setDraft] = useState<Partial<Request> | null>(null);

  const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name ?? "—";

  const list = useMemo(
    () =>
      requests.filter((r) => {
        if (scope === "inbox") return awaitsMe(r, me);
        if (scope === "mine") return r.created_by === me;
        return true;
      }),
    [requests, scope, me],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-j-line bg-j-surface p-1">
          {SCOPES.map(([k, l]) => {
            const n =
              k === "inbox"
                ? requests.filter((r) => awaitsMe(r, me)).length
                : k === "mine"
                  ? requests.filter((r) => r.created_by === me).length
                  : requests.length;
            return (
              <button
                key={k}
                onClick={() => setScope(k)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  scope === k ? "bg-j-brand-soft font-semibold text-j-brand" : "text-j-dim"
                }`}
              >
                {l} {n > 0 ? <span className="mark">{n}</span> : null}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDraft({ kind: "general", priority: 2 })}
          className={`${jPrimary} ms-auto`}
        >
          + طلب
        </button>
      </div>

      {list.length === 0 ? (
        <Empty
          title={scope === "inbox" ? "لا طلبات تنتظر قرارك" : "لا طلبات"}
          hint={scope === "inbox" ? "ما يصلك للاعتماد يظهر هنا" : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpen(r)}
              className="flex items-center gap-3 rounded-2xl border border-j-line bg-j-surface p-3.5 text-start shadow-j-sm"
            >
              <span className="mark w-12 shrink-0 text-xs text-j-faint">#{r.number}</span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{r.title}</span>
                <span className="truncate text-[11px] text-j-faint">
                  {nameOf(r.created_by)} · {sinceText(r.created_at)}
                  {r.amount != null ? ` · ${money(r.amount)}` : ""}
                </span>
              </span>

              <Tag tone={PRIORITY.find((p) => p.v === r.priority)?.tone}>
                {PRIORITY.find((p) => p.v === r.priority)?.label}
              </Tag>
              <Tag tone={STATUS_TONE[r.status]}>{REQUEST_STATUS[r.status]}</Tag>
            </button>
          ))}
        </div>
      )}

      <RequestSheet
        request={open}
        members={members}
        chains={chains}
        onClose={() => setOpen(null)}
        onChanged={onChanged}
      />

      <RequestForm
        draft={draft}
        chains={chains}
        me={me}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSaved={onChanged}
      />
    </div>
  );
}
