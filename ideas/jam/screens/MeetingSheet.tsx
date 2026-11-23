"use client";

import { useState } from "react";
import type { Department, Meeting, Member } from "../types";
import { remove, save } from "../db";
import { fmtDate, fmtTime } from "../format";
import { Modal, jField, jGhost, jPrimary } from "../ui";

const TABS = [
  { k: "info" as const, t: "البيانات" },
  { k: "agenda" as const, t: "جدول الأعمال" },
  { k: "minutes" as const, t: "المحضر والقرارات" },
];

/** يُركَّب عند الفتح ويُفكَّك عند الإغلاق، فلا حاجة لمزامنة المسوّدة بتأثير */
export function MeetingSheet({
  draft,
  members,
  departments,
  me,
  onClose,
  onSaved,
}: {
  draft: Partial<Meeting>;
  members: Member[];
  departments: Department[];
  me: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [row, setRow] = useState<Partial<Meeting>>(draft);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "agenda" | "minutes">("info");

  const toggleAttendee = (id: string) => {
    const list = row.attendees ?? [];
    setRow({
      ...row,
      attendees: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    });
  };

  const submit = async () => {
    if (!row.title?.trim()) return;
    setError(null);
    try {
      await save("jam_meetings", {
        ...(row.id ? { id: row.id } : {}),
        title: row.title.trim(),
        held_at: row.held_at || new Date().toISOString(),
        number: row.number ?? null,
        location: row.location ?? null,
        department_id: row.department_id ?? null,
        attendees: row.attendees ?? [],
        guests: row.guests ?? null,
        agenda: row.agenda ?? null,
        notes: row.notes ?? null,
        decisions: row.decisions ?? null,
        is_private: Boolean(row.is_private),
        created_by: row.created_by ?? me,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={row.id ? "محضر اجتماع" : "اجتماع جديد"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void submit()} className={jPrimary + " flex-1"}>
            حفظ
          </button>
          {row.id && (
            <button
              onClick={async () => {
                const id = row.id;
                if (!id) return;
                await remove("jam_meetings", id);
                onSaved();
                onClose();
              }}
              className={jGhost}
            >
              حذف
            </button>
          )}
        </div>
      }
    >
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex gap-1 rounded-xl bg-j-raised p-1">
        {TABS.map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={
              "flex-1 rounded-lg px-3 py-2 text-xs transition " +
              (tab === x.k ? "bg-j-surface font-semibold shadow-j-sm" : "text-j-dim")
            }
          >
            {x.t}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <>
          <input
            className={jField}
            value={row.title ?? ""}
            onChange={(e) => setRow({ ...row, title: e.target.value })}
            placeholder="موضوع الاجتماع"
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">الوقت</span>
              <input
                type="datetime-local"
                className={jField}
                value={(row.held_at ?? "").slice(0, 16)}
                onChange={(e) =>
                  setRow({
                    ...row,
                    held_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                  })
                }
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">رقم الاجتماع</span>
              <input
                type="number"
                className={jField + " mark"}
                value={row.number ?? ""}
                onChange={(e) =>
                  setRow({ ...row, number: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">المكان</span>
              <input
                className={jField}
                value={row.location ?? ""}
                onChange={(e) => setRow({ ...row, location: e.target.value || null })}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-j-dim">الإدارة</span>
              <select
                className={jField}
                value={row.department_id ?? ""}
                onChange={(e) => setRow({ ...row, department_id: e.target.value || null })}
              >
                <option value="">— عام —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-j-dim">الحاضرون ({(row.attendees ?? []).length})</span>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = (row.attendees ?? []).includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleAttendee(m.id)}
                    className={
                      jGhost +
                      " px-3 py-1.5 text-xs " +
                      (on ? "border-j-brand bg-j-brand/10 text-j-brand" : "")
                    }
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            className={jField}
            value={row.guests ?? ""}
            onChange={(e) => setRow({ ...row, guests: e.target.value || null })}
            placeholder="ضيوف من خارج الجمعية"
          />

          <label className="flex items-center justify-between rounded-xl border border-j-line bg-j-surface px-4 py-3">
            <span className="flex flex-col">
              <span className="text-sm">محضر مقيّد</span>
              <span className="text-[11px] text-j-faint">يظهر لمن حضره فقط</span>
            </span>
            <input
              type="checkbox"
              className="size-4 accent-[var(--j-brand)]"
              checked={Boolean(row.is_private)}
              onChange={(e) => setRow({ ...row, is_private: e.target.checked })}
            />
          </label>
        </>
      )}

      {tab === "agenda" && (
        <textarea
          className={jField + " min-h-64 resize-none leading-relaxed"}
          value={row.agenda ?? ""}
          onChange={(e) => setRow({ ...row, agenda: e.target.value || null })}
          placeholder={"بند أول\nبند ثان\nبند ثالث"}
        />
      )}

      {tab === "minutes" && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">المداولات</span>
            <textarea
              className={jField + " min-h-40 resize-none leading-relaxed"}
              value={row.notes ?? ""}
              onChange={(e) => setRow({ ...row, notes: e.target.value || null })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-j-dim">القرارات</span>
            <textarea
              className={jField + " min-h-32 resize-none leading-relaxed"}
              value={row.decisions ?? ""}
              onChange={(e) => setRow({ ...row, decisions: e.target.value || null })}
            />
          </label>

          {row.held_at && (
            <p className="text-[11px] text-j-faint">
              انعقد {fmtDate(row.held_at)} — {fmtTime(row.held_at)}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
