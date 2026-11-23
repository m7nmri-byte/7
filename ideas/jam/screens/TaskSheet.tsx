"use client";

import { useEffect, useState } from "react";
import type { Department, Member, Task, TaskUpdate } from "../types";
import { TASK_STATUS } from "../types";
import { fetchTaskUpdates, patch, save } from "../db";
import { fmtDate, fmtTime, sinceText } from "../format";
import { Modal, Tag, jField, jGhost, jPrimary } from "../ui";
import { FileField } from "../FileField";
import { PRIORITY } from "./task-core";

const TONE: Record<string, string> = {
  todo: "var(--j-faint)",
  doing: "var(--j-info)",
  done: "var(--j-ok)",
  blocked: "var(--j-danger)",
};

/** تفاصيل مهمة: مسارها، وما كُتب عليها، وشاهد إنجازها */
export function TaskSheet({
  task,
  members,
  departments,
  subtasks,
  me,
  onClose,
  onChanged,
  onEdit,
  onOpenTask,
  onAddSub,
}: {
  task: Task;
  members: Member[];
  departments: Department[];
  subtasks: Task[];
  me: string | null;
  onClose: () => void;
  onChanged: () => void;
  onEdit: () => void;
  onOpenTask: (t: Task) => void;
  onAddSub: () => void;
}) {
  const [updates, setUpdates] = useState<TaskUpdate[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [doneNote, setDoneNote] = useState(task.done_note ?? "");
  const [proof, setProof] = useState(task.proof_url);

  useEffect(() => {
    let alive = true;
    fetchTaskUpdates(task.id)
      .then((u) => alive && setUpdates(u))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "تعذّر التحميل"));
    return () => {
      alive = false;
    };
  }, [task.id]);

  const nameOf = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : "—";
  const deptOf = (id: string | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? null) : null;

  const addUpdate = async () => {
    const content = note.trim();
    if (!content) return;
    setError(null);
    try {
      await save("jam_task_updates", { task_id: task.id, author_id: me, content });
      setNote("");
      setUpdates(await fetchTaskUpdates(task.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الإضافة");
    }
  };

  /** الإغلاق يحفظ الشاهد والملاحظة مع الحالة في نداء واحد */
  const finish = async () => {
    setError(null);
    try {
      await patch("jam_tasks", task.id, {
        status: "done",
        done_at: new Date().toISOString(),
        done_note: doneNote.trim() || null,
        proof_url: proof,
      });
      setClosing(false);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الإغلاق");
    }
  };

  const setStatus = async (status: Task["status"]) => {
    setError(null);
    try {
      await patch("jam_tasks", task.id, {
        status,
        done_at: status === "done" ? new Date().toISOString() : null,
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التغيير");
    }
  };

  const prio = PRIORITY.find((p) => p.v === task.priority);

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={task.title}
      footer={
        <div className="flex gap-2">
          {task.status === "done" ? (
            <button onClick={() => void setStatus("doing")} className={jGhost + " flex-1"}>
              أعِد فتحها
            </button>
          ) : (
            <button onClick={() => setClosing(true)} className={jPrimary + " flex-1"}>
              أنجزتها
            </button>
          )}
          <button onClick={onEdit} className={jGhost}>
            تعديل
          </button>
        </div>
      }
    >
      {error && <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Tag tone={TONE[task.status]}>{TASK_STATUS[task.status]}</Tag>
        {prio && <Tag tone={prio.tone}>{prio.label}</Tag>}
        {task.due_date && <Tag>يُسلَّم {fmtDate(task.due_date)}</Tag>}
        {deptOf(task.department_id) && <Tag>{deptOf(task.department_id)}</Tag>}
        {task.recurrence && <Tag tone="var(--j-accent)">متكرّرة</Tag>}
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-j-raised px-4 py-3 text-xs">
        <span className="flex gap-2">
          <span className="w-14 shrink-0 text-j-faint">المسؤول</span>
          <span>{nameOf(task.assignee_id)}</span>
        </span>
        <span className="flex gap-2">
          <span className="w-14 shrink-0 text-j-faint">أسندها</span>
          <span>{nameOf(task.creator_id)}</span>
        </span>
        {task.done_at && (
          <span className="flex gap-2">
            <span className="w-14 shrink-0 text-j-faint">أُنجزت</span>
            <span className="mark">
              {fmtDate(task.done_at)} — {fmtTime(task.done_at)}
            </span>
          </span>
        )}
      </div>

      {task.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.body}</p>}

      {task.attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المرفقات</span>
          {task.attachments.map((a, i) => (
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

      {(task.done_note || task.proof_url) && (
        <div className="flex flex-col gap-2 rounded-xl border border-j-ok/30 bg-j-ok/5 p-3">
          <span className="text-xs font-semibold text-j-ok">ما سُلّم</span>
          {task.done_note && (
            <p className="whitespace-pre-wrap text-xs leading-relaxed">{task.done_note}</p>
          )}
          {task.proof_url && (
            <a
              href={task.proof_url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs text-j-brand"
            >
              الشاهد
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-j-dim">مهام فرعية ({subtasks.length})</span>
          <button onClick={onAddSub} className="text-[11px] text-j-brand">
            + فرعية
          </button>
        </div>
          {subtasks.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpenTask(s)}
              className="flex items-center gap-2 rounded-lg bg-j-raised px-3 py-2 text-start"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: TONE[s.status] }}
              />
              <span className="flex-1 truncate text-xs">{s.title}</span>
              <span className="shrink-0 text-[10px] text-j-faint">{TASK_STATUS[s.status]}</span>
            </button>
          ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-j-dim">المتابعات</span>

        {updates === null ? (
          <p className="text-[11px] text-j-faint">جارٍ التحميل…</p>
        ) : updates.length === 0 ? (
          <p className="text-[11px] text-j-faint">لا متابعات بعد</p>
        ) : (
          <div className="flex flex-col gap-2">
            {updates.map((u) => (
              <div key={u.id} className="flex flex-col gap-1 rounded-xl bg-j-raised px-3 py-2">
                <span className="flex items-baseline gap-2">
                  <span className="text-[11px] font-medium">{nameOf(u.author_id)}</span>
                  <span className="mark text-[10px] text-j-faint">{sinceText(u.created_at)}</span>
                </span>
                <p className="whitespace-pre-wrap text-xs leading-relaxed">{u.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className={jField + " flex-1"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addUpdate();
            }}
            placeholder="اكتب متابعة"
          />
          <button onClick={() => void addUpdate()} className={jGhost}>
            أضف
          </button>
        </div>
      </div>

      {closing && (
        <div className="flex flex-col gap-3 rounded-xl border border-j-line bg-j-raised/60 p-3">
          <span className="text-xs font-semibold">ما الذي سُلّم؟</span>
          <textarea
            className={jField + " min-h-20 resize-none"}
            value={doneNote}
            onChange={(e) => setDoneNote(e.target.value)}
            placeholder="وصف مختصر لما أُنجز"
          />
          <FileField
            label="شاهد الإنجاز"
            folder="jam/tasks"
            value={proof}
            onChange={(f) => setProof(f ? f.url : null)}
          />
          <div className="flex gap-2">
            <button onClick={() => void finish()} className={jPrimary + " flex-1"}>
              أغلِق المهمة
            </button>
            <button onClick={() => setClosing(false)} className={jGhost}>
              تراجع
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
