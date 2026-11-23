"use client";

import { useMemo, useRef, useState } from "react";
import type { Doc, Member } from "../types";
import { remove, save } from "../db";
import { fmtDate } from "../format";
import { Empty, jField, jGhost, jPrimary } from "../ui";
import { fileSize, uploadFile } from "../FileField";

const CATEGORIES = [
  "تراخيص ونظام",
  "عقود واتفاقيات",
  "تقارير",
  "قوائم مالية",
  "صور ومرئيات",
  "مخاطبات",
  "أخرى",
];

const EXT_TONE: Record<string, string> = {
  pdf: "var(--j-danger)",
  doc: "var(--j-info)",
  docx: "var(--j-info)",
  xls: "var(--j-ok)",
  xlsx: "var(--j-ok)",
  png: "var(--j-accent)",
  jpg: "var(--j-accent)",
  jpeg: "var(--j-accent)",
};

const extOf = (url: string) => (url.split(".").pop() ?? "").toLowerCase().slice(0, 4);

export function Documents({
  docs,
  members,
  me,
  onChanged,
}: {
  docs: Doc[];
  members: Member[];
  me: string | null;
  onChanged: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");

  const name = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : "—";

  const shown = useMemo(() => {
    const t = q.trim();
    return docs.filter(
      (d) => (!filter || d.category === filter) && (!t || d.title.includes(t)),
    );
  }, [docs, filter, q]);

  const totalSize = useMemo(
    () => docs.reduce((s, d) => s + (d.size_bytes ?? 0), 0),
    [docs],
  );

  /** الرفع يُسجّل الملف في المكتبة فورًا — التصنيف يأتي من الاختيار أعلاه */
  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      for (const f of [...files]) {
        const up = await uploadFile(f, "jam/docs");
        await save("jam_documents", {
          title: up.name,
          category: cat,
          file_url: up.url,
          size_bytes: up.bytes,
          uploaded_by: me,
        });
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">التصنيف عند الرفع</span>
            <select
              className={jField + " w-auto"}
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => input.current?.click()}
            disabled={busy}
            className={jPrimary + " disabled:opacity-50"}
          >
            {busy ? "جارٍ الرفع…" : "ارفع ملفات"}
          </button>

          <span className="flex-1" />
          <span className="mark text-xs text-j-faint">
            {docs.length} ملفًا · {fileSize(totalSize)}
          </span>
        </div>

        {error && <p className="text-[11px] text-j-danger">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className={jField + " min-w-40 flex-1"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("")}
            className={
              jGhost + " px-3 py-1.5 text-xs " + (filter === "" ? "border-j-brand text-j-brand" : "")
            }
          >
            الكل
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={
                jGhost +
                " px-3 py-1.5 text-xs " +
                (filter === c ? "border-j-brand text-j-brand" : "")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا ملفات" hint="مكتبة واحدة بدل ملفات مبثوثة في الأجهزة" />
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => {
            const ext = extOf(d.file_url);
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-j-line bg-j-surface px-3 py-2.5 shadow-j-sm"
              >
                <span
                  className="mark grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                  style={{
                    color: EXT_TONE[ext] ?? "var(--j-faint)",
                    backgroundColor:
                      "color-mix(in oklab, " + (EXT_TONE[ext] ?? "var(--j-faint)") + " 12%, transparent)",
                  }}
                >
                  {ext || "?"}
                </span>

                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate text-xs font-medium">{d.title}</span>
                  <span className="mark block text-[10px] text-j-faint">
                    {fileSize(d.size_bytes)} · {name(d.uploaded_by)} · {fmtDate(d.created_at)}
                  </span>
                </a>

                <button
                  onClick={async () => {
                    await remove("jam_documents", d.id);
                    onChanged();
                  }}
                  className="shrink-0 text-xs text-j-danger"
                  title="حذف"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input ref={input} type="file" multiple hidden onChange={(e) => void add(e.target.files)} />
    </div>
  );
}
