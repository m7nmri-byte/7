"use client";

import { useMemo, useState } from "react";
import type { Department, Meeting, Member } from "../types";
import { fmtDate, fmtTime } from "../format";
import { Empty, jField, jPrimary } from "../ui";
import { MeetingSheet } from "./MeetingSheet";

export function Meetings({
  meetings,
  members,
  departments,
  me,
  onChanged,
}: {
  meetings: Meeting[];
  members: Member[];
  departments: Department[];
  me: string | null;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Meeting> | null>(null);
  const [q, setQ] = useState("");
  const [deptId, setDeptId] = useState("");

  /**
   * المحضر المقيّد لا يظهر إلّا لمن حضره أو كتبه.
   * التصفية هنا واجهة فقط؛ الحجب الحقيقي يلزمه سياسة في قاعدة البيانات.
   */
  const visible = useMemo(
    () =>
      meetings.filter(
        (m) => !m.is_private || (me !== null && (m.attendees.includes(me) || m.created_by === me)),
      ),
    [meetings, me],
  );

  const shown = useMemo(() => {
    const t = q.trim();
    return visible.filter(
      (m) =>
        (!deptId || m.department_id === deptId) &&
        (!t ||
          m.title.includes(t) ||
          (m.decisions ?? "").includes(t) ||
          (m.agenda ?? "").includes(t) ||
          (m.notes ?? "").includes(t)),
    );
  }, [visible, q, deptId]);

  /** تجميع بالسنة والشهر لقراءة السجلّ كأرشيف لا كقائمة طويلة */
  const groups = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of shown) {
      const key = m.held_at.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [shown]);

  const monthLabel = (key: string) => {
    const [y, mo] = key.split("-");
    return new Intl.DateTimeFormat("ar-SA", { month: "long", year: "numeric" }).format(
      new Date(Number(y), Number(mo) - 1, 1),
    );
  };

  const deptName = (id: string | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input
          className={jField + " min-w-48 flex-1"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث في المواضيع والقرارات"
        />
        <select
          className={jField + " w-auto"}
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
        >
          <option value="">كل الإدارات</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setDraft({ held_at: new Date().toISOString(), attendees: [], is_private: false })
          }
          className={jPrimary}
        >
          + اجتماع
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="لا اجتماعات" hint="كل اجتماع يُحفظ بجدول أعماله ومحضره وقراراته" />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([key, items]) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3 px-1">
                <span className="text-xs font-semibold text-j-dim">{monthLabel(key)}</span>
                <span className="h-px flex-1 bg-j-line" />
                <span className="mark text-[10px] text-j-faint">{items.length}</span>
              </div>

              {items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDraft(m)}
                  className="flex flex-col gap-2 rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      {m.number !== null && (
                        <span className="mark shrink-0 rounded-md bg-j-raised px-2 py-0.5 text-[10px] text-j-dim">
                          #{m.number}
                        </span>
                      )}
                      <span className="truncate text-sm font-semibold">{m.title}</span>
                    </span>
                    <span className="mark shrink-0 text-[11px] text-j-faint">
                      {fmtDate(m.held_at)} · {fmtTime(m.held_at)}
                    </span>
                  </div>

                  {m.decisions && (
                    <p className="line-clamp-2 rounded-lg bg-j-raised/60 px-3 py-2 text-xs leading-relaxed text-j-dim">
                      {m.decisions}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-j-faint">
                    <span>{m.attendees.length} حاضرًا</span>
                    {m.location && <span>· {m.location}</span>}
                    {deptName(m.department_id) && <span>· {deptName(m.department_id)}</span>}
                    {m.is_private && <span className="text-j-warn">· مقيّد</span>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {meetings.length > visible.length && (
        <p className="text-center text-[11px] text-j-faint">
          {meetings.length - visible.length} محضرًا مقيّدًا لا يظهر لك
        </p>
      )}

      {draft && (
        <MeetingSheet
          key={draft.id ?? "new"}
          draft={draft}
          members={members}
          departments={departments}
          me={me}
          onClose={() => setDraft(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
