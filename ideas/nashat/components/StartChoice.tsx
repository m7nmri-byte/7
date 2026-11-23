"use client";

import type { Task } from "../types";
import { MAX_PARALLEL } from "../types";
import { Sheet } from "./ui";

export type StartIntent =
  | { type: "new"; name: string }
  | { type: "resume"; id: string; name: string };

export type StartDecision =
  | { kind: "parallel" }
  | { kind: "close"; status: "completed" | "interrupted"; taskId: string };

/**
 * شيء يعمل الآن وتريد بدء غيره — فماذا يحلّ بالجاري؟
 * ثلاثة طرق: يعمل معه بالتوازي، أو يُنهى، أو يُعلَّق. وعرضها صراحةً
 * أوضح من قرار ضمني يتّخذه التطبيق عنك.
 */
export function StartChoice({
  intent,
  actives,
  onClose,
  onDecide,
}: {
  intent: StartIntent;
  actives: Task[];
  onClose: () => void;
  onDecide: (d: StartDecision) => void;
}) {
  const row =
    "flex w-full flex-col gap-0.5 rounded-xl border border-n-line bg-n-bg px-3.5 py-3 text-start transition-colors hover:border-n-accent/40";

  return (
    <Sheet open onClose={onClose} title={`البدء في: ${intent.name}`}>
      {actives.length < MAX_PARALLEL && actives[0] && (
        <button onClick={() => onDecide({ kind: "parallel" })} className={row}>
          <span className="text-sm font-medium">
            بالتوازي مع «{actives[0].name}»
          </span>
          <span className="text-xs text-n-dim">تبقى الحالية تعمل، وتبدأ هذه معها</span>
        </button>
      )}

      {actives.map((a) => (
        <div key={a.id} className="flex flex-col gap-2">
          <button
            onClick={() => onDecide({ kind: "close", status: "completed", taskId: a.id })}
            className={row}
          >
            <span className="text-sm font-medium">إنهاء «{a.name}»</span>
            <span className="text-xs text-n-dim">تُسجَّل مُنجزة، ثم تبدأ هذه</span>
          </button>

          <button
            onClick={() => onDecide({ kind: "close", status: "interrupted", taskId: a.id })}
            className={row}
          >
            <span className="text-sm font-medium">مقاطعة «{a.name}»</span>
            <span className="text-xs text-n-dim">تبقى معلّقة، ثم تبدأ هذه</span>
          </button>
        </div>
      ))}
    </Sheet>
  );
}

/** ماذا تفعل بمهمة معلّقة: تستأنفها، أو تنهيها، أو تصرفها */
export function PendingActions({
  task,
  onClose,
  onResume,
  onComplete,
  onDismiss,
}: {
  task: Task;
  onClose: () => void;
  onResume: () => void;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const row =
    "flex w-full flex-col gap-0.5 rounded-xl border border-n-line bg-n-bg px-3.5 py-3 text-start transition-colors hover:border-n-accent/40";

  return (
    <Sheet open onClose={onClose} title={task.name}>
      <button onClick={onResume} className={row}>
        <span className="text-sm font-medium">ابدأ فيها الآن</span>
      </button>

      <button onClick={onComplete} className={row}>
        <span className="text-sm font-medium">سجّلها مكتملة</span>
      </button>

      <button onClick={onDismiss} className={row}>
        <span className="text-sm font-medium">لا أريد إكمالها</span>
        <span className="text-xs text-n-dim">تخرج من المعلّقة وتبقى في السجل</span>
      </button>
    </Sheet>
  );
}
