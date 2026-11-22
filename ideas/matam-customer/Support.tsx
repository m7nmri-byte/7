"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Ticket } from "../matam/types";
import { fetchTicketMessages, sendTicketMessage } from "../matam/db";
import { useLive } from "../matam/hooks";
import { sinceText } from "../matam/format";
import { Empty, mField, mPrimary } from "../matam/ui";

const CATEGORIES = ["استفسار", "شكوى عن طلب", "اقتراح", "أخرى"];

export function Support({
  deviceId,
  tickets,
  name,
  phone,
  onRefresh,
}: {
  deviceId: string;
  tickets: Ticket[];
  name: string;
  phone: string;
  onRefresh: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const open = tickets.find((t) => t.id === openId) ?? null;

  const start = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { data } = await supabase
      .from("matam_tickets")
      .insert({
        device_id: deviceId,
        customer_name: name,
        customer_phone: phone,
        category,
        status: "open",
      })
      .select()
      .single();
    if (data) {
      await sendTicketMessage(data.id as string, {
        sender_role: "customer",
        sender_name: name || "زبون",
        text: text.trim(),
      });
      setText("");
      onRefresh();
      setOpenId(data.id as string);
    }
    setBusy(false);
  };

  if (open) return <Thread ticket={open} name={name} onBack={() => setOpenId(null)} />;

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-m-line bg-m-surface p-4">
        <h2 className="text-sm font-semibold">تذكرة جديدة</h2>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                category === c
                  ? "bg-m-accent font-semibold text-[#1a1204]"
                  : "border border-m-line text-m-dim"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <textarea
          className={`${mField} min-h-24 resize-none`}
          placeholder="اكتب رسالتك"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={start} disabled={busy || !text.trim()} className={mPrimary}>
          {busy ? "جارٍ الإرسال…" : "أرسل"}
        </button>
      </section>

      {tickets.length === 0 ? (
        <Empty title="لا توجد تذاكر" />
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-m-dim">تذاكرك</h2>
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpenId(t.id)}
              className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3 text-start"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{t.category}</span>
                <span className="text-[11px] text-m-faint">{sinceText(t.updated_at)}</span>
              </span>
              <span
                className={`shrink-0 text-[11px] ${t.status === "open" ? "text-m-ok" : "text-m-faint"}`}
              >
                {t.status === "open" ? "مفتوحة" : "مغلقة"}
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Thread({
  ticket,
  name,
  onBack,
}: {
  ticket: Ticket;
  name: string;
  onBack: () => void;
}) {
  const load = useCallback(() => fetchTicketMessages(ticket.id), [ticket.id]);
  const { data, refresh } = useLive("matam_ticket_messages", load);
  const [text, setText] = useState("");
  const messages = data ?? [];

  const send = async () => {
    if (!text.trim()) return;
    await sendTicketMessage(ticket.id, {
      sender_role: "customer",
      sender_name: name || "زبون",
      text: text.trim(),
    });
    setText("");
    void refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-m-line px-4 py-3">
        <button onClick={onBack} className="text-sm text-m-dim">
          ‹ رجوع
        </button>
        <span className="text-sm font-medium">{ticket.category}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender_role === "customer";
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                mine ? "self-start bg-m-accent-soft" : "self-end bg-m-raised"
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              <span className="mt-1 block text-[10px] text-m-faint">
                {sinceText(m.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-m-line p-3">
        <input
          className={mField}
          placeholder="رسالتك"
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
