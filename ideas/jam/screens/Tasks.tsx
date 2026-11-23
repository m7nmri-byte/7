"use client";

import { useMemo, useState } from "react";
import type { Department, Meeting, Member, Task, TaskStatus } from "../types";
import { TASK_STATUS } from "../types";
import { patch } from "../db";
import { fmtDate } from "../format";
import { useMe } from "../hooks";
import { Empty, Tag, jPrimary } from "../ui";
import { PRIORITY, STATUS_TONE, dueTone, nextStatus, sortTasks } from "./task-core";
import { TaskForm } from "./TaskForm";
import { TaskSheet } from "./TaskSheet";

const SCOPES = [
  ["mine", "مهامي"],
  ["created", "أسندتها"],
  ["all", "الكل"],
] as const;

const FILTERS = [
  ["open", "المفتوحة"],
  ["todo", "لم تبدأ"],
  ["doing", "جارية"],
  ["blocked", "متعثّرة"],
  ["done", "مكتملة"],
] as const;

const tab = (on: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs transition-colors ${
    on ? "bg-j-brand-soft font-semibold text-j-brand" : "text-j-dim hover:text-j-text"
  }`;

export function Tasks({
  tasks,
  members,
  departments,
  meetings,
  onChanged,
}: {
  tasks: Task[];
  members: Member[];
  departments: Department[];
  meetings: Meeting[];
  onChanged: () => void;
}) {
  const me = useMe();
  const [scope, setScope] = useState<(typeof SCOPES)[number][0]>("mine");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("open");
  const [draft, setDraft] = useState<Partial<Task> | null>(null);
  const [open, setOpen] = useState<Task | null>(null);

  const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name ?? "—";

  const list = useMemo(
    () =>
      sortTasks(
        tasks.filter((t) => {
          if (scope === "mine" && t.assignee_id !== me) return false;
          if (scope === "created" && t.creator_id !== me) return false;
          if (filter === "open") return t.status !== "done";
          return t.status === (filter as TaskStatus);
        }),
      ),
    [tasks, scope, filter, me],
  );

  const advance = async (t: Task) => {
    const next = nextStatus(t.status);
    await patch("jam_tasks", t.id, {
      status: next,
      done_at: next === "done" ? new Date().toISOString() : null,
    });
    onChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-j-line bg-j-surface p-1">
          {SCOPES.map(([k, l]) => (
            <button key={k} onClick={() => setScope(k)} className={tab(scope === k)}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl border border-j-line bg-j-surface p-1">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={tab(filter === k)}>
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={() => setDraft({ status: "todo", priority: 3, assignee_id: me })}
          className={`${jPrimary} ms-auto`}
        >
          + مهمة
        </button>
      </div>

      {list.length === 0 ? (
        <Empty title="لا مهام هنا" hint="أضف مهمة أو غيّر التصفية" />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((t) => (
            <article
              key={t.id}
              className="flex items-start gap-3 rounded-2xl border border-j-line bg-j-surface p-3.5 shadow-j-sm"
            >
              <button
                onClick={() => void advance(t)}
                aria-label="غيّر الحالة"
                title={TASK_STATUS[t.status]}
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: STATUS_TONE[t.status],
                  backgroundColor:
                    t.status === "done" ? STATUS_TONE[t.status] : "transparent",
                }}
              >
                {t.status === "done" && (
                  <svg
                    viewBox="0 0 16 16"
                    className="size-3"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.4"
                  >
                    <path d="m4 8.4 2.6 2.6L12 5.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setOpen(t)}
                className="flex min-w-0 flex-1 flex-col gap-1 text-start"
              >
                <span
                  className={`text-sm font-medium ${
                    t.status === "done" ? "text-j-faint line-through" : ""
                  }`}
                >
                  {t.title}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-j-faint">
                  <span>{nameOf(t.assignee_id)}</span>
                  {t.due_date && (
                    <span style={{ color: dueTone(t.due_date, t.status) }}>
                      {fmtDate(t.due_date)}
                    </span>
                  )}
                  {t.department_id && (
                    <span>{departments.find((d) => d.id === t.department_id)?.name}</span>
                  )}
                  {t.recurrence && <span>متكرّرة</span>}
                </span>
              </button>

              <Tag tone={PRIORITY.find((p) => p.v === t.priority)?.tone}>
                {PRIORITY.find((p) => p.v === t.priority)?.label}
              </Tag>
            </article>
          ))}
        </div>
      )}

      {open && (
        <TaskSheet
          key={open.id}
          task={open}
          members={members}
          departments={departments}
          subtasks={tasks.filter((t) => t.parent_id === open.id)}
          me={me}
          onClose={() => setOpen(null)}
          onChanged={onChanged}
          onEdit={() => {
            const t = open;
            setOpen(null);
            setDraft(t);
          }}
          onOpenTask={setOpen}
          onAddSub={() => {
            const t = open;
            setOpen(null);
            setDraft({ status: "todo", priority: 3, parent_id: t.id, department_id: t.department_id });
          }}
        />
      )}

      <TaskForm
        draft={draft}
        members={members}
        departments={departments}
        meetings={meetings}
        me={me}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSaved={onChanged}
      />
    </div>
  );
}
