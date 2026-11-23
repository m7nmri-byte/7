"use client";

import { useState } from "react";
import type { Department, Meeting, Member, Task, TaskStatus } from "../types";
import { TASK_STATUS } from "../types";
import { remove, save } from "../db";
import { Modal, jField, jGhost, jPrimary, jOption } from "../ui";
import { Attachments } from "../FileField";
import { PRIORITY } from "./task-core";

export function TaskForm({
  draft,
  members,
  departments,
  meetings,
  me,
  onChange,
  onClose,
  onSaved,
}: {
  draft: Partial<Task> | null;
  members: Member[];
  departments: Department[];
  meetings: Meeting[];
  me: string | null;
  onChange: (d: Partial<Task>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;

  const set = (p: Partial<Task>) => onChange({ ...draft, ...p });

  const submit = async () => {
    if (!draft.title?.trim()) return;
    setError(null);
    try {
      await save("jam_tasks", {
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title.trim(),
        body: draft.body ?? null,
        assignee_id: draft.assignee_id ?? null,
        creator_id: draft.creator_id ?? me,
        department_id: draft.department_id ?? null,
        status: draft.status ?? "todo",
        priority: Number(draft.priority ?? 3),
        due_date: draft.due_date || null,
        recurrence: draft.recurrence ?? null,
        attachments: draft.attachments ?? [],
        meeting_id: draft.meeting_id ?? null,
        parent_id: draft.parent_id ?? null,
      });
      onClose();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={draft.id ? "تعديل مهمة" : "مهمة جديدة"}
      footer={
        <div className="flex gap-2">
          <button onClick={() => void submit()} className={`${jPrimary} flex-1`}>
            حفظ
          </button>
          {draft.id && (
            <button
              onClick={async () => {
                const id = draft.id;
                if (!id) return;
                await remove("jam_tasks", id);
                onClose();
                onSaved();
              }}
              className={jGhost}
            >
              حذف
            </button>
          )}
        </div>
      }
    >
      {error && (
        <p className="rounded-lg bg-j-danger/10 px-3 py-2 text-xs text-j-danger">{error}</p>
      )}

      <input
        className={jField}
        value={draft.title ?? ""}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="عنوان المهمة"
      />

      <textarea
        className={`${jField} min-h-24 resize-none`}
        value={draft.body ?? ""}
        onChange={(e) => set({ body: e.target.value || null })}
        placeholder="التفاصيل"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">المسؤول</span>
          <select
            className={jField}
            value={draft.assignee_id ?? ""}
            onChange={(e) => set({ assignee_id: e.target.value || null })}
          >
            <option value="">— غير مسند —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الإدارة</span>
          <select
            className={jField}
            value={draft.department_id ?? ""}
            onChange={(e) => set({ department_id: e.target.value || null })}
          >
            <option value="">— بلا إدارة —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">موعد التسليم</span>
          <input
            type="date"
            className={jField}
            value={draft.due_date ?? ""}
            onChange={(e) => set({ due_date: e.target.value || null })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-j-dim">الأولوية</span>
          <select
            className={jField}
            value={String(draft.priority ?? 3)}
            onChange={(e) => set({ priority: Number(e.target.value) })}
          >
            {PRIORITY.map((p) => (
              <option key={p.v} value={p.v}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        {(Object.keys(TASK_STATUS) as TaskStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => set({ status: s })}
            className={`${jOption(draft.status === s)} flex-1 py-2 text-xs`}
          >
            {TASK_STATUS[s]}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-j-dim">نشأت عن اجتماع</span>
        <select
          className={jField}
          value={draft.meeting_id ?? ""}
          onChange={(e) => set({ meeting_id: e.target.value || null })}
        >
          <option value="">— لا —</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-j-dim">التكرار</span>
        <select
          className={jField}
          value={draft.recurrence ?? ""}
          onChange={(e) => set({ recurrence: e.target.value || null })}
        >
          <option value="">بلا تكرار</option>
          <option value="daily">يومية</option>
          <option value="weekly">أسبوعية</option>
          <option value="monthly">شهرية</option>
        </select>
      </label>

      <Attachments
        value={draft.attachments ?? []}
        onChange={(attachments) => set({ attachments })}
        folder="jam/tasks"
      />
    </Modal>
  );
}
