"use client";

import { useMemo, useState } from "react";
import type { Donor, Grant } from "../types";
import { remove, save } from "../db";
import { money } from "../format";
import { Empty, Modal, jField, jGhost, jPrimary } from "../ui";

const KINDS = ["جهة حكومية", "شركة", "مؤسسة مانحة", "جمعية", "فرد", "أخرى"];

export function Donors({
  donors,
  grants,
  onChanged,
}: {
  donors: Donor[];
  grants: Grant[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Donor> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  /** ما تحصّل فعلًا من كل مانح — من المنح لا من حقل محفوظ */
  const stats = useMemo(() => {
    const m = new Map<string, { collected: number; count: number }>();
    for (const g of grants) {
      if (!g.donor_id) continue;
      const cur = m.get(g.donor_id) ?? { collected: 0, count: 0 };
      cur.collected += Number(g.collected);
      cur.count += 1;
      m.set(g.donor_id, cur);
    }
    return m;
  }, [grants]);

  const shown = useMemo(() => {
    const t = q.trim();
    if (!t) return donors;
    return donors.filter(
      (d) =>
        d.name.includes(t) ||
        d.kind.includes(t) ||
        (d.contact ?? "").includes(t) ||
        (d.phone ?? "").includes(t),
    );
  }, [donors, q]);

  const submit = async () => {
    if (!draft?.name?.trim()) return;
    setError(null);
    try {
      await save("jam_donors", {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        kind: draft.kind ?? KINDS[0],
        contact: draft.contact ?? null,
        phone: draft.phone ?? null,
        email: draft.email ?? null,
        url: draft.url ?? null,
        notes: draft.notes ?? null,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          className={jField + " flex-1"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث في المانحين"
        />
        <button onClick={() => setDraft({ kind: KINDS[0] })} className={jPrimary}>
          + مانح
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا مانحين" hint="سجّل الجهات التي تموّل برامج الجمعية" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => {
            const s = stats.get(d.id);
            return (
              <button
                key={d.id}
                onClick={() => setDraft(d)}
                className="flex flex-col gap-2 rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{d.name}</span>
                  <span className="shrink-0 rounded-md bg-j-raised px-2 py-0.5 text-[10px] text-j-dim">
                    {d.kind}
                  </span>
                </div>
                {d.contact && <span className="truncate text-xs text-j-dim">{d.contact}</span>}
                {d.phone && <span className="mark text-xs text-j-faint" dir="ltr">{d.phone}</span>}
                <div className="mt-1 flex items-baseline gap-2 border-t border-j-line pt-2 text-xs">
                  <span className="mark font-semibold text-j-ok">{money(s?.collected ?? 0)}</span>
                  <span className="text-j-faint">عبر {s?.count ?? 0} منحة</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل مانح" : "مانح جديد"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void submit()} className={jPrimary + " flex-1"}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  const id = draft.id;
                  if (!id) return;
                  await remove("jam_donors", id);
                  setDraft(null);
                  onChanged();
                }}
                className={jGhost}
              >
                حذف
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <>
            {error && (
              <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
            )}
            <input
              className={jField}
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="اسم المانح"
            />
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setDraft({ ...draft, kind: k })}
                  className={
                    jGhost +
                    " px-3 py-1.5 text-xs " +
                    (draft.kind === k ? "border-j-brand text-j-brand" : "")
                  }
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              className={jField}
              value={draft.contact ?? ""}
              onChange={(e) => setDraft({ ...draft, contact: e.target.value || null })}
              placeholder="شخص التواصل"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={jField + " mark"}
                dir="ltr"
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
                placeholder="هاتف"
              />
              <input
                className={jField}
                dir="ltr"
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value || null })}
                placeholder="بريد"
              />
            </div>
            <input
              className={jField}
              dir="ltr"
              value={draft.url ?? ""}
              onChange={(e) => setDraft({ ...draft, url: e.target.value || null })}
              placeholder="الموقع"
            />
            <textarea
              className={jField + " min-h-20 resize-none"}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
              placeholder="ملاحظات"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
