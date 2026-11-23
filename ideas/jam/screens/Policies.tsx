"use client";

import { useMemo, useState } from "react";
import type { Member, Policy } from "../types";
import { remove, save } from "../db";
import { daysUntil, fmtDate } from "../format";
import { Empty, Modal, jField, jGhost, jPrimary } from "../ui";
import { FileField } from "../FileField";

const CATEGORIES = [
  "اللائحة الأساسية",
  "لوائح مالية",
  "لوائح موارد بشرية",
  "سياسات حماية",
  "سياسات تشغيل",
  "حوكمة ومجلس",
  "أخرى",
];

export function Policies({
  policies,
  members,
  onChanged,
}: {
  policies: Policy[];
  members: Member[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Policy> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState("");

  const shown = useMemo(
    () => policies.filter((p) => !cat || p.category === cat),
    [policies, cat],
  );

  /** السياسة التي حلّ موعد مراجعتها أو قاربه — هذا ما يُنسى في الجمعيات */
  const due = useMemo(
    () =>
      policies.filter((p) => {
        if (!p.review_due) return false;
        const d = daysUntil(p.review_due);
        return d <= 30;
      }),
    [policies],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Policy[]>();
    for (const p of shown) map.set(p.category, [...(map.get(p.category) ?? []), p]);
    return [...map.entries()];
  }, [shown]);

  const submit = async () => {
    if (!draft?.title?.trim()) return;
    setError(null);
    try {
      await save("jam_policies", {
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title.trim(),
        category: draft.category ?? CATEGORIES[0],
        body: draft.body ?? null,
        file_url: draft.file_url ?? null,
        version: draft.version ?? null,
        approved_at: draft.approved_at || null,
        review_due: draft.review_due || null,
        owner_id: draft.owner_id ?? null,
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {due.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-j-warn/30 bg-j-warn/5 p-4">
          <span className="text-xs font-semibold text-j-warn">
            {due.length} سياسة تحتاج مراجعة
          </span>
          <div className="flex flex-wrap gap-2">
            {due.map((p) => {
              const d = p.review_due ? daysUntil(p.review_due) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setDraft(p)}
                  className="rounded-lg bg-j-surface px-3 py-1.5 text-xs"
                >
                  {p.title}
                  <span className="mark ms-2 text-[10px] text-j-faint">
                    {d < 0 ? "تأخّرت " + -d + " يومًا" : "بعد " + d + " يومًا"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={jField + " w-auto"}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">كل التصنيفات</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        <button onClick={() => setDraft({ category: CATEGORIES[0] })} className={jPrimary}>
          + سياسة
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا سياسات" hint="اللوائح المعتمدة ومواعيد مراجعتها" />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([c, items]) => (
            <div key={c} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3 px-1">
                <span className="text-xs font-semibold text-j-dim">{c}</span>
                <span className="h-px flex-1 bg-j-line" />
              </div>
              {items.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-j-line bg-j-surface px-4 py-3 shadow-j-sm"
                >
                  <button onClick={() => setDraft(p)} className="min-w-0 flex-1 text-start">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-medium">{p.title}</span>
                      {p.version && (
                        <span className="mark shrink-0 rounded bg-j-raised px-1.5 text-[10px] text-j-faint">
                          {p.version}
                        </span>
                      )}
                    </span>
                    <span className="mark block text-[11px] text-j-faint">
                      {p.approved_at ? "اعتُمدت " + fmtDate(p.approved_at) : "غير معتمدة"}
                      {p.review_due ? " · مراجعة " + fmtDate(p.review_due) : ""}
                    </span>
                  </button>
                  {p.file_url && (
                    <a
                      href={p.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-j-brand"
                    >
                      الملف
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        wide
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل سياسة" : "سياسة جديدة"}
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
                  await remove("jam_policies", id);
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
              value={draft.title ?? ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="عنوان السياسة"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">التصنيف</span>
                <select
                  className={jField}
                  value={draft.category ?? CATEGORIES[0]}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">الإصدار</span>
                <input
                  className={jField + " mark"}
                  value={draft.version ?? ""}
                  onChange={(e) => setDraft({ ...draft, version: e.target.value || null })}
                  placeholder="1.0"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">تاريخ الاعتماد</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.approved_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, approved_at: e.target.value || null })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">موعد المراجعة</span>
                <input
                  type="date"
                  className={jField}
                  value={draft.review_due ?? ""}
                  onChange={(e) => setDraft({ ...draft, review_due: e.target.value || null })}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">المسؤول عنها</span>
              <select
                className={jField}
                value={draft.owner_id ?? ""}
                onChange={(e) => setDraft({ ...draft, owner_id: e.target.value || null })}
              >
                <option value="">— غير محدّد —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>

            <FileField
              label="ملف السياسة"
              folder="jam/policies"
              value={draft.file_url ?? null}
              onChange={(f) => setDraft({ ...draft, file_url: f ? f.url : null })}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">النصّ</span>
              <textarea
                className={jField + " min-h-48 resize-none leading-relaxed"}
                value={draft.body ?? ""}
                onChange={(e) => setDraft({ ...draft, body: e.target.value || null })}
                placeholder="نصّ السياسة، ليكون قابلًا للبحث دون فتح الملف"
              />
            </label>
          </>
        )}
      </Modal>
    </div>
  );
}
