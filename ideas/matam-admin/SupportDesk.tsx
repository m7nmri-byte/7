"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Ticket } from "../matam/types";
import { fetchTicketMessages, sendTicketMessage } from "../matam/db";
import { useLive } from "../matam/hooks";
import { sinceText } from "../matam/format";
import { Empty, mField, mGhost, mPrimary } from "../matam/ui";

export function SupportDesk({
  tickets,
  onChanged,
}: {
  tickets: Ticket[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState<Ticket | null>(null);

  if (open) return <Thread ticket={open} onBack={() => setOpen(null)} onChanged={onChanged} />;

  if (!tickets.length) return <Empty title="لا تذاكر دعم" />;

  return (
    <div className="flex flex-col gap-2 p-4">
      {tickets.map((t) => (
        <button
          key={t.id}
          onClick={() => setOpen(t)}
          className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{t.customer_name || "زبون"}</span>
            <span className="truncate text-[11px] text-m-dim">{t.category}</span>
            <span className="text-[11px] text-m-faint">{sinceText(t.updated_at)}</span>
          </span>
          <span
            className={`shrink-0 text-[11px] ${t.status === "open" ? "text-m-ok" : "text-m-faint"}`}
          >
            {t.status === "open" ? "مفتوحة" : "مغلقة"}
          </span>
        </button>
      ))}
    </div>
  );
}

function Thread({
  ticket,
  onBack,
  onChanged,
}: {
  ticket: Ticket;
  onBack: () => void;
  onChanged: () => void;
}) {
  const load = useCallback(() => fetchTicketMessages(ticket.id), [ticket.id]);
  const { data, refresh } = useLive("matam_ticket_messages", load);
  const [text, setText] = useState("");
  const messages = data ?? [];

  const send = async () => {
    if (!text.trim()) return;
    await sendTicketMessage(ticket.id, {
      sender_role: "staff",
      sender_name: "الإدارة",
      text: text.trim(),
    });
    setText("");
    void refresh();
    onChanged();
  };

  const close = async () => {
    await supabase.from("matam_tickets").update({ status: "closed" }).eq("id", ticket.id);
    onChanged();
    onBack();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-m-line px-4 py-3">
        <button onClick={onBack} className="text-sm text-m-dim">
          ‹ رجوع
        </button>
        <span className="flex-1 truncate text-sm font-medium">
          {ticket.customer_name || "زبون"} · {ticket.category}
        </span>
        <button onClick={() => void close()} className={`${mGhost} px-3 py-1.5 text-xs`}>
          إغلاق
        </button>
      </div>

      {ticket.customer_phone && (
        <a
          href={`tel:${ticket.customer_phone}`}
          dir="ltr"
          className="mark border-b border-m-line px-4 py-2 text-xs text-m-info"
        >
          {ticket.customer_phone}
        </a>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.sender_role === "staff"
                ? "self-end bg-m-accent-soft"
                : "self-start bg-m-raised"
            }`}
          >
            <p className="leading-relaxed">{m.text}</p>
            <span className="mt-1 block text-[10px] text-m-faint">
              {m.sender_name} · {sinceText(m.created_at)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-m-line p-3">
        <input
          className={mField}
          placeholder="ردّك"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
        />
        <button onClick={() => void send()} className={mPrimary}>
          إرسال
        </button>
      </div>
    </div>
  );
}
