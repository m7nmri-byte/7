"use client";

import { useMemo, useState } from "react";
import type { Achievement, Member, NewsItem, Program } from "../types";
import { patch, remove, save } from "../db";
import { fmtDate } from "../format";
import { Empty, Modal, jField, jGhost, jPrimary } from "../ui";
import { FileField } from "../FileField";

const CATEGORIES = ["إعلان داخلي", "خبر", "تعميم", "تهنئة", "تنبيه"];

const CAT_TONE: Record<string, string> = {
  "إعلان داخلي": "var(--j-brand)",
  خبر: "var(--j-info)",
  تعميم: "var(--j-accent)",
  تهنئة: "var(--j-ok)",
  تنبيه: "var(--j-warn)",
};

export function News({
  news,
  achievements,
  members,
  programs,
  onChanged,
}: {
  news: NewsItem[];
  achievements: Achievement[];
  members: Member[];
  programs: Program[];
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<"news" | "wins">("news");
  const [draft, setDraft] = useState<Partial<NewsItem> | null>(null);
  const [win, setWin] = useState<Partial<Achievement> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberName = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : "—";
  const programName = (id: string | null) =>
    id ? (programs.find((p) => p.id === id)?.name ?? "—") : null;

  /** الإنجازات مرتّبة بالأحدث، ومجمّعة بالعضو لقراءة من يُنجز */
  const byMember = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of achievements)
      if (a.member_id) m.set(a.member_id, (m.get(a.member_id) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [achievements]);

  const saveNews = async () => {
    if (!draft?.title?.trim()) return;
    setError(null);
    try {
      await save("jam_news", {
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title.trim(),
        body: draft.body ?? null,
        category: draft.category ?? CATEGORIES[0],
        cover_url: draft.cover_url ?? null,
        published: Boolean(draft.published),
        published_at: draft.published_at || new Date().toISOString(),
      });
      setDraft(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  const saveWin = async () => {
    if (!win?.title?.trim()) return;
    setError(null);
    try {
      await save("jam_achievements", {
        ...(win.id ? { id: win.id } : {}),
        title: win.title.trim(),
        member_id: win.member_id ?? null,
        program_id: win.program_id ?? null,
        happened_on: win.happened_on || new Date().toISOString().slice(0, 10),
        proof_url: win.proof_url ?? null,
      });
      setWin(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-j-raised p-1">
          {(
            [
              ["news", "الأخبار والتعاميم"],
              ["wins", "الإنجازات"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "rounded-lg px-3 py-1.5 text-xs transition " +
                (tab === k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        {tab === "news" ? (
          <button
            onClick={() => setDraft({ category: CATEGORIES[0], published: true })}
            className={jPrimary}
          >
            + خبر
          </button>
        ) : (
          <button
            onClick={() => setWin({ happened_on: new Date().toISOString().slice(0, 10) })}
            className={jPrimary}
          >
            + إنجاز
          </button>
        )}
      </div>

      {tab === "news" &&
        (news.length === 0 ? (
          <Empty title="لا أخبار" hint="لوحة واحدة يقرأها الفريق كلّه" />
        ) : (
          <div className="flex flex-col gap-3">
            {news.map((n) => (
              <div
                key={n.id}
                className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm"
              >
                {n.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.cover_url} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setDraft(n)} className="min-w-0 flex-1 text-start">
                      <span className="flex items-baseline gap-2">
                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px]"
                          style={{
                            color: CAT_TONE[n.category] ?? "var(--j-dim)",
                            backgroundColor:
                              "color-mix(in oklab, " +
                              (CAT_TONE[n.category] ?? "var(--j-dim)") +
                              " 12%, transparent)",
                          }}
                        >
                          {n.category}
                        </span>
                        <span className="truncate text-sm font-semibold">{n.title}</span>
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        await patch("jam_news", n.id, { published: !n.published });
                        onChanged();
                      }}
                      className={
                        "shrink-0 text-[11px] " + (n.published ? "text-j-ok" : "text-j-faint")
                      }
                    >
                      {n.published ? "منشور" : "مسوّدة"}
                    </button>
                  </div>

                  {n.body && (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-j-dim">
                      {n.body}
                    </p>
                  )}

                  <span className="mark text-[10px] text-j-faint">{fmtDate(n.published_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "wins" && (
        <>
          {byMember.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {byMember.map(([id, count]) => (
                <span
                  key={id}
                  className="flex items-baseline gap-2 rounded-xl border border-j-line bg-j-surface px-3 py-2 text-xs"
                >
                  <span className="font-medium">{memberName(id)}</span>
                  <span className="mark text-j-ok">{count}</span>
                </span>
              ))}
            </div>
          )}

          {achievements.length === 0 ? (
            <Empty title="لا إنجازات مسجّلة" hint="ما يُسجّل يُقاس، وما يُقاس يتحسّن" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-j-line bg-j-surface shadow-j-sm">
              {achievements.map((a, i) => (
                <div
                  key={a.id}
                  className={
                    "flex items-center gap-3 px-4 py-3 " + (i > 0 ? "border-t border-j-line" : "")
                  }
                >
                  <button onClick={() => setWin(a)} className="min-w-0 flex-1 text-start">
                    <span className="block truncate text-sm">{a.title}</span>
                    <span className="mark block text-[11px] text-j-faint">
                      {fmtDate(a.happened_on)}
                      {a.member_id ? " · " + memberName(a.member_id) : ""}
                      {programName(a.program_id) ? " · " + programName(a.program_id) : ""}
                    </span>
                  </button>
                  {a.proof_url && (
                    <a
                      href={a.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-j-brand"
                    >
                      الشاهد
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(draft)}
        wide
        onClose={() => setDraft(null)}
        title={draft?.id ? "تعديل خبر" : "خبر جديد"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void saveNews()} className={jPrimary + " flex-1"}>
              حفظ
            </button>
            {draft?.id && (
              <button
                onClick={async () => {
                  const id = draft.id;
                  if (!id) return;
                  await remove("jam_news", id);
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
              placeholder="العنوان"
            />

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, category: c })}
                  className={
                    jGhost +
                    " px-3 py-1.5 text-xs " +
                    (draft.category === c ? "border-j-brand text-j-brand" : "")
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            <textarea
              className={jField + " min-h-40 resize-none leading-relaxed"}
              value={draft.body ?? ""}
              onChange={(e) => setDraft({ ...draft, body: e.target.value || null })}
              placeholder="النصّ"
            />

            <FileField
              label="صورة الغلاف"
              folder="jam/news"
              value={draft.cover_url ?? null}
              onChange={(f) => setDraft({ ...draft, cover_url: f ? f.url : null })}
            />

            <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
              <span className="text-sm">منشور للفريق</span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--j-brand)]"
                checked={Boolean(draft.published)}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
            </label>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(win)}
        onClose={() => setWin(null)}
        title={win?.id ? "تعديل إنجاز" : "إنجاز جديد"}
        footer={
          <div className="flex gap-2">
            <button onClick={() => void saveWin()} className={jPrimary + " flex-1"}>
              حفظ
            </button>
            {win?.id && (
              <button
                onClick={async () => {
                  const id = win.id;
                  if (!id) return;
                  await remove("jam_achievements", id);
                  setWin(null);
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
        {win && (
          <>
            {error && (
              <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
            )}

            <input
              className={jField}
              value={win.title ?? ""}
              onChange={(e) => setWin({ ...win, title: e.target.value })}
              placeholder="ماذا تحقّق"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">التاريخ</span>
                <input
                  type="date"
                  className={jField}
                  value={win.happened_on ?? ""}
                  onChange={(e) => setWin({ ...win, happened_on: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-j-dim">العضو</span>
                <select
                  className={jField}
                  value={win.member_id ?? ""}
                  onChange={(e) => setWin({ ...win, member_id: e.target.value || null })}
                >
                  <option value="">— الجمعية —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">البرنامج</span>
              <select
                className={jField}
                value={win.program_id ?? ""}
                onChange={(e) => setWin({ ...win, program_id: e.target.value || null })}
              >
                <option value="">— بلا برنامج —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <FileField
              label="الشاهد"
              folder="jam/wins"
              value={win.proof_url ?? null}
              onChange={(f) => setWin({ ...win, proof_url: f ? f.url : null })}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
