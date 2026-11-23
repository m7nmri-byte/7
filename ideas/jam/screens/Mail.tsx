"use client";

import { useMemo, useState } from "react";
import type { Mail as MailRow, MailRead, Member } from "../types";
import { markMailRead, remove, save } from "../db";
import { fmtDate, fmtTime, sinceText } from "../format";
import { Empty, Modal, jField, jGhost, jPrimary, jOption } from "../ui";
import { Attachments } from "../FileField";

const KINDS = [
  { v: "internal", label: "داخلي" },
  { v: "incoming", label: "وارد" },
  { v: "outgoing", label: "صادر" },
];

const KIND_TONE: Record<string, string> = {
  internal: "var(--j-brand)",
  incoming: "var(--j-info)",
  outgoing: "var(--j-accent)",
};

export function Mail({
  mail,
  reads,
  members,
  me,
  onChanged,
}: {
  mail: MailRow[];
  reads: MailRead[];
  members: Member[];
  me: string | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<MailRow> | null>(null);
  const [open, setOpen] = useState<MailRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState<"in" | "out" | "all">("all");

  /** من قرأ كل مخاطبة — يُبنى مرّة لا مرّة لكل سطر */
  const readers = useMemo(() => {
    const m = new Map<string, MailRead[]>();
    for (const r of reads) m.set(r.mail_id, [...(m.get(r.mail_id) ?? []), r]);
    return m;
  }, [reads]);

  /** المخاطبة موجّهة إليّ ولم أفتحها بعد */
  const isUnread = (m: MailRow) =>
    me !== null &&
    (m.to_ids.includes(me) || m.cc_ids.includes(me)) &&
    !(readers.get(m.id) ?? []).some((r) => r.member_id === me);

  const openMail = (m: MailRow) => {
    setOpen(m);
    /** تُسجَّل القراءة ولا يُنتظر نجاحها: فتح الرسالة لا ينبغي أن يتعلّق بها */
    if (me && (m.to_ids.includes(me) || m.cc_ids.includes(me)))
      void markMailRead(m.id, me).then(onChanged, () => {});
  };
  const [q, setQ] = useState("");

  const name = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : "—";

  const shown = useMemo(() => {
    const t = q.trim();
    return mail.filter((m) => {
      const mine =
        box === "all" ||
        (box === "in" && me !== null && (m.to_ids.includes(me) || m.cc_ids.includes(me))) ||
        (box === "out" && m.from_id === me);
      return (
        mine &&
        (!t ||
          m.subject.includes(t) ||
          (m.body ?? "").includes(t) ||
          (m.external_party ?? "").includes(t))
      );
    });
  }, [mail, box, me, q]);

  const toggle = (field: "to_ids" | "cc_ids", id: string) => {
    if (!draft) return;
    const list = draft[field] ?? [];
    setDraft({
      ...draft,
      [field]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    });
  };

  const submit = async () => {
    if (!draft?.subject?.trim()) return;
    setError(null);
    try {
      await save("jam_mail", {
        ...(draft.id ? { id: draft.id } : {}),
        ...(draft.number ? { number: draft.number } : {}),
        subject: draft.subject.trim(),
        body: draft.body ?? null,
        kind: draft.kind ?? "internal",
        from_id: draft.from_id ?? me,
        to_ids: draft.to_ids ?? [],
        cc_ids: draft.cc_ids ?? [],
        external_party: draft.external_party ?? null,
        attachments: draft.attachments ?? [],
        sent_at: draft.sent_at || new Date().toISOString(),
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {(
            [
              ["all", "الكل"],
              ["in", "الوارد إليّ"],
              ["out", "ما أرسلته"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setBox(k)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (box === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <input
          className={jField + " min-w-40 flex-1"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث"
        />

        <button
          onClick={() =>
            setDraft({
              kind: "internal",
              from_id: me,
              to_ids: [],
              cc_ids: [],
              attachments: [],
              sent_at: new Date().toISOString(),
            })
          }
          className={jPrimary}
        >
          + مخاطبة
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا مخاطبات" hint="الوارد والصادر والتعاميم الداخلية بترقيم واحد" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm">
          {shown.map((m, i) => (
            <button
              key={m.id}
              onClick={() => openMail(m)}
              className={
                "flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-j-raised " +
                (i > 0 ? "border-t border-j-line" : "")
              }
            >
              <span
                className="mark w-12 shrink-0 text-center text-[11px] font-semibold"
                style={{ color: KIND_TONE[m.kind] ?? "var(--j-dim)" }}
              >
                {m.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  {isUnread(m) && (
                    <span className="size-1.5 shrink-0 rounded-full bg-j-brand" aria-label="غير مقروءة" />
                  )}
                  <span
                    className={
                      "truncate text-sm " + (isUnread(m) ? "font-bold" : "font-medium")
                    }
                  >
                    {m.subject}
                  </span>
                </span>
                <span className="block truncate text-[11px] text-j-faint">
                  {name(m.from_id)}
                  {m.external_party ? " ↔ " + m.external_party : ""}
                  {m.to_ids.length > 0 ? " → " + m.to_ids.map(name).join("، ") : ""}
                </span>
              </span>
              {m.attachments.length > 0 && (
                <span className="mark shrink-0 text-[10px] text-j-faint">
                  {m.attachments.length} مرفق
                </span>
              )}
              <span className="mark shrink-0 text-[11px] text-j-faint">{fmtDate(m.sent_at)}</span>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(open)}
        wide
        onClose={() => setOpen(null)}
        title={open ? "مخاطبة رقم " + open.number : ""}
        footer={
          open && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const src = open;
                  setOpen(null);
                  setDraft({
                    kind: src.kind,
                    from_id: me,
                    /** الردّ يعود إلى المرسِل، ومن كان معه في «إلى» يبقى نسخة */
                    to_ids: src.from_id ? [src.from_id] : [],
                    cc_ids: src.to_ids.filter((x) => x !== me),
                    subject: "ردّ: " + src.subject,
                    external_party: src.external_party,
                    attachments: [],
                    sent_at: new Date().toISOString(),
                  });
                }}
                className={jPrimary + " flex-1"}
              >
                ردّ
              </button>
              <button
                onClick={() => {
                  const src = open;
                  setOpen(null);
                  setDraft(src);
                }}
                className={jGhost}
              >
                تعديل
              </button>
            </div>
          )
        }
      >
        {open && (
          <>
            <h3 className="text-base font-semibold leading-relaxed">{open.subject}</h3>

            <div className="flex flex-col gap-1 rounded-xl bg-j-raised px-4 py-3 text-xs">
              <span className="flex gap-2">
                <span className="w-12 shrink-0 text-j-faint">من</span>
                <span>{name(open.from_id)}</span>
              </span>
              {open.to_ids.length > 0 && (
                <span className="flex gap-2">
                  <span className="w-12 shrink-0 text-j-faint">إلى</span>
                  <span>{open.to_ids.map(name).join("، ")}</span>
                </span>
              )}
              {open.cc_ids.length > 0 && (
                <span className="flex gap-2">
                  <span className="w-12 shrink-0 text-j-faint">نسخة</span>
                  <span>{open.cc_ids.map(name).join("، ")}</span>
                </span>
              )}
              {open.external_party && (
                <span className="flex gap-2">
                  <span className="w-12 shrink-0 text-j-faint">جهة</span>
                  <span>{open.external_party}</span>
                </span>
              )}
              <span className="flex gap-2">
                <span className="w-12 shrink-0 text-j-faint">التاريخ</span>
                <span className="mark">
                  {fmtDate(open.sent_at)} — {fmtTime(open.sent_at)}
                </span>
              </span>
            </div>

            {open.body && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{open.body}</p>
            )}

            {open.attachments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {open.attachments.map((a, i) => (
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

            {(readers.get(open.id) ?? []).length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-j-dim">قرأها</span>
                <div className="flex flex-wrap gap-2">
                  {(readers.get(open.id) ?? []).map((r) => (
                    <span
                      key={r.member_id}
                      className="flex items-baseline gap-1.5 rounded-lg bg-j-raised px-2.5 py-1 text-[11px]"
                    >
                      <span>{name(r.member_id)}</span>
                      <span className="mark text-[10px] text-j-faint">{sinceText(r.read_at)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                await remove("jam_mail", open.id);
                setOpen(null);
                onChanged();
              }}
              className="self-start text-xs text-j-danger"
            >
              حذف المخاطبة
            </button>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(draft)}
        wide
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل مخاطبة" : "مخاطبة جديدة"}
        footer={
          <button onClick={() => void submit()} className={jPrimary + " w-full"}>
            حفظ
          </button>
        }
      >
        {draft && (
          <>
            {error && (
              <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
            )}

            <div className="flex gap-1 rounded-xl bg-j-raised p-1">
              {KINDS.map((k) => (
                <button
                  key={k.v}
                  onClick={() => setDraft({ ...draft, kind: k.v })}
                  className={
                    "flex-1 rounded-lg px-3 py-2 text-xs transition " +
                    ((draft.kind ?? "internal") === k.v
                      ? "bg-j-surface font-semibold shadow-j-sm"
                      : "text-j-dim")
                  }
                >
                  {k.label}
                </button>
              ))}
            </div>

            <input
              className={jField}
              value={draft.subject ?? ""}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder="الموضوع"
            />

            {draft.kind !== "internal" && (
              <input
                className={jField}
                value={draft.external_party ?? ""}
                onChange={(e) => setDraft({ ...draft, external_party: e.target.value || null })}
                placeholder="الجهة الخارجية"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">من</span>
                <select
                  className={jField}
                  value={draft.from_id ?? ""}
                  onChange={(e) => setDraft({ ...draft, from_id: e.target.value || null })}
                >
                  <option value="">— غير محدّد —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">التاريخ</span>
                <input
                  type="datetime-local"
                  className={jField}
                  value={(draft.sent_at ?? "").slice(0, 16)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sent_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                    })
                  }
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">إلى ({(draft.to_ids ?? []).length})</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggle("to_ids", m.id)}
                    className={
                      jOption((draft.to_ids ?? []).includes(m.id)) + " px-3 py-1.5 text-xs"
                    }
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-j-dim">نسخة ({(draft.cc_ids ?? []).length})</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggle("cc_ids", m.id)}
                    className={
                      jGhost +
                      " px-3 py-1.5 text-xs " +
                      ((draft.cc_ids ?? []).includes(m.id)
                        ? "border-j-accent bg-j-accent/10 text-j-accent"
                        : "")
                    }
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className={jField + " min-h-40 resize-none leading-relaxed"}
              value={draft.body ?? ""}
              onChange={(e) => setDraft({ ...draft, body: e.target.value || null })}
              placeholder="النصّ"
            />

            <Attachments
              value={draft.attachments ?? []}
              onChange={(attachments) => setDraft({ ...draft, attachments })}
              folder="jam/mail"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
