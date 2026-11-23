"use client";

import { useCallback, useState } from "react";
import type { Chain, Member, Request } from "../types";
import { REQUEST_STATUS } from "../types";
import { fetchChainSteps, fetchRequestLogs, logRequest, patch } from "../db";
import { money, sinceText } from "../format";
import { useLive, useMe } from "../hooks";
import { Modal, Tag, jField, jGhost, jPrimary } from "../ui";
import {
  KINDS,
  PRIORITY,
  STATUS_TONE,
  afterApprove,
  afterDelegate,
  afterExecuted,
  afterForward,
  afterReject,
  afterReturn,
  awaitsMe,
  isMine,
  onResubmit,
} from "./request-core";

const ACTION_LABEL: Record<string, string> = {
  submitted: "رُفع",
  forwarded: "مُرّر",
  approved: "اعتُمد",
  rejected: "رُفض",
  returned: "أُرجع",
  delegated: "حُوّل للتنفيذ",
  resubmitted: "أُعيد إرساله",
};

export function RequestSheet({
  request,
  members,
  chains,
  onClose,
  onChanged,
}: {
  request: Request | null;
  members: Member[];
  chains: Chain[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const me = useMe();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  /** من نحوّل إليه أو نُحيل، ونوع العملية */
  const [hand, setHand] = useState<{ kind: "forward" | "delegate"; to: string } | null>(null);

  const loadLogs = useCallback(
    () => (request ? fetchRequestLogs(request.id) : Promise.resolve([])),
    [request],
  );
  const { data: logs } = useLive("jam_request_logs", loadLogs);

  if (!request) return null;

  const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name ?? "—";

  const act = async (
    values: Partial<Request>,
    action: Parameters<typeof logRequest>[1],
  ) => {
    setBusy(true);
    await patch("jam_requests", request.id, values as Record<string, unknown>);
    await logRequest(request.id, action, request.current_step, me, note);
    setBusy(false);
    setNote("");
    onClose();
    onChanged();
  };

  const approve = async () => {
    const steps = request.chain_id ? await fetchChainSteps(request.chain_id) : [];
    await act(afterApprove(request, steps), "approved");
  };

  const resubmit = async () => {
    const steps = request.chain_id ? await fetchChainSteps(request.chain_id) : [];
    await act(onResubmit(steps), "resubmitted");
  };

  const mine = isMine(request, me);
  const turn = awaitsMe(request, me);

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={`طلب #${request.number} — ${request.title}`}
      footer={
        hand ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-j-dim">
              {hand.kind === "forward" ? "حوّل المراجعة إلى" : "أحِل التنفيذ إلى"}
            </span>
            <select
              className={jField}
              value={hand.to}
              onChange={(e) => setHand({ ...hand, to: e.target.value })}
            >
              <option value="">— اختر عضوًا —</option>
              {members
                .filter((m) => m.is_active && m.id !== me)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                disabled={busy || !hand.to}
                onClick={() =>
                  void act(
                    hand.kind === "forward"
                      ? afterForward(hand.to, note)
                      : afterDelegate(hand.to, note),
                    hand.kind === "forward" ? "forwarded" : "delegated",
                  )
                }
                className={`${jPrimary} flex-1`}
              >
                تأكيد
              </button>
              <button onClick={() => setHand(null)} className={jGhost}>
                تراجع
              </button>
            </div>
          </div>
        ) : request.status === "delegated" && request.delegated_to === me ? (
          <button
            disabled={busy}
            onClick={() => void act(afterExecuted(note), "approved")}
            className={`${jPrimary} w-full`}
          >
            تمّ التنفيذ
          </button>
        ) : turn ? (
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => void approve()} className={`${jPrimary} flex-1`}>
              اعتماد
            </button>
            <button
              disabled={busy}
              onClick={() => setHand({ kind: "forward", to: "" })}
              className={jGhost}
            >
              حوّل المراجعة
            </button>
            <button
              disabled={busy}
              onClick={() => void act(afterReturn(note), "returned")}
              className={jGhost}
            >
              إرجاع للمرسل
            </button>
            <button
              disabled={busy}
              onClick={() => void act(afterReject(note), "rejected")}
              className={`${jGhost} text-j-danger`}
            >
              رفض
            </button>
          </div>
        ) : mine && request.status === "returned" ? (
          <button disabled={busy} onClick={() => void resubmit()} className={`${jPrimary} w-full`}>
            إعادة الإرسال
          </button>
        ) : request.status === "approved" ? (
          <button
            disabled={busy}
            onClick={() => setHand({ kind: "delegate", to: "" })}
            className={`${jGhost} w-full`}
          >
            أحِل للتنفيذ
          </button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={STATUS_TONE[request.status]}>{REQUEST_STATUS[request.status]}</Tag>
        <Tag tone={PRIORITY.find((p) => p.v === request.priority)?.tone}>
          {PRIORITY.find((p) => p.v === request.priority)?.label}
        </Tag>
        <Tag>{KINDS.find((k) => k.v === request.kind)?.label ?? request.kind}</Tag>
        {request.amount != null && <Tag tone="var(--j-accent)">{money(request.amount)}</Tag>}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-j-raised p-3 text-xs">
        <div>
          <dt className="text-j-dim">مقدّم الطلب</dt>
          <dd className="font-medium">{nameOf(request.created_by)}</dd>
        </div>
        <div>
          <dt className="text-j-dim">عند</dt>
          <dd className="font-medium">
            {request.status === "delegated"
              ? nameOf(request.delegated_to) + " (تنفيذًا)"
              : nameOf(request.current_reviewer)}
          </dd>
        </div>
        <div>
          <dt className="text-j-dim">السلسلة</dt>
          <dd className="font-medium">
            {chains.find((c) => c.id === request.chain_id)?.name ?? "بلا سلسلة"}
          </dd>
        </div>
        <div>
          <dt className="text-j-dim">الخطوة</dt>
          <dd className="mark font-medium">{request.current_step}</dd>
        </div>
      </dl>

      {request.body && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.body}</p>
      )}

      {request.attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المرفقات</span>
          {request.attachments.map((a, i) => (
            <a
              key={a.url + i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="truncate rounded-lg bg-j-raised px-3 py-2 text-xs text-j-brand"
            >
              {a.name}
            </a>
          ))}
        </div>
      )}

      {request.review_note && (
        <p className="rounded-xl bg-j-accent/10 px-3 py-2.5 text-xs text-j-accent">
          ملاحظة المراجع: {request.review_note}
        </p>
      )}

      {turn && (
        <input
          className={jField}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة على القرار (اختياري)"
        />
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-j-dim">مسار الطلب</h3>
        <ol className="flex flex-col gap-1.5">
          {(logs ?? []).map((l) => (
            <li key={l.id} className="flex items-center gap-2.5 text-xs">
              <span className="size-1.5 shrink-0 rounded-full bg-j-brand" />
              <span className="flex-1">
                {ACTION_LABEL[l.action] ?? l.action} — {nameOf(l.actor_id)}
                {l.note ? ` · ${l.note}` : ""}
              </span>
              <span className="text-j-faint">{sinceText(l.created_at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  );
}
