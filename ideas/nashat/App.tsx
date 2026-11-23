"use client";

import { useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Category, Task } from "./types";
import { MAX_PARALLEL } from "./types";
import * as A from "./actions";
import { activeTasks, allDays, dayStats, pendingTasks, timelineRows } from "./model";
import { addDays, arDate, todayStr } from "./time";
import { mergeImported } from "./storage";
import { runExport } from "./export";
import { useNashat } from "./useNashat";
import { DayCharts, RangeCharts, type Period, periodDays } from "./charts";
import { DayNav, Summary, ViewTabs } from "./components/DayBar";
import { EmptyNow, NowCard } from "./components/NowCard";
import { PendingStack, Timeline } from "./components/Timeline";
import { Memos } from "./components/Memos";
import {
  PendingActions,
  StartChoice,
  type StartIntent,
} from "./components/StartChoice";
import { Toast, useNow, useToast } from "./components/ui";
import { InputSheet } from "./components/InputSheet";
import { NextSheet } from "./components/NextSheet";
import { EditSheet } from "./components/EditSheet";
import { AddPastSheet } from "./components/AddPastSheet";
import { FullscreenTimer } from "./components/FullscreenTimer";
import {
  ConfirmSheet,
  ExportSheet,
  ImportSheet,
  MenuSheet,
  type ExportKind,
} from "./components/misc-sheets";

type Dialog =
  | { kind: "none" }
  | { kind: "step"; taskId: string; taskName: string }
  | { kind: "next"; close: "completed" | "interrupted"; title: string }
  | { kind: "parallel" }
  | { kind: "startChoice"; intent: StartIntent; memoId?: string }
  | { kind: "pendingActions"; taskId: string }
  | { kind: "edit"; taskId: string; segIdx: number }
  | { kind: "addPast"; prevEnd: string | null; nextStart: string | null }
  | { kind: "menu" }
  | { kind: "export" }
  | { kind: "import" }
  | { kind: "confirm"; title: string; desc: string; run: () => void };

const SYNC_LABEL = {
  offline: "محليًا فقط",
  syncing: "يزامن…",
  synced: "محفوظ",
  error: "تعذّر الحفظ",
} as const;

const PERIODS = [
  ["day", "يوم"],
  ["week", "أسبوع"],
  ["month", "شهر"],
  ["year", "سنة"],
  ["all", "الكل"],
] as const;

export function NashatApp({ session }: { session: Session }) {
  const { state, update, sync } = useNashat(session);
  const { message, toast } = useToast();
  const now = useNow();

  const [day, setDay] = useState(todayStr);
  const [view, setView] = useState<"log" | "stats">("log");
  const [period, setPeriod] = useState<Period>("day");
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  const close = () => setDialog({ kind: "none" });

  const actives = useMemo(() => activeTasks(state.tasks), [state.tasks]);
  const pending = useMemo(() => pendingTasks(state.tasks), [state.tasks]);
  const rows = useMemo(() => timelineRows(state.tasks, day), [state.tasks, day]);
  const stats = useMemo(() => dayStats(state.tasks, day), [state.tasks, day]);
  const days = useMemo(() => allDays(state.tasks), [state.tasks]);

  const isToday = day === todayStr();
  const idx = days.indexOf(day);
  const byId = (id: string): Task | null => state.tasks.find((t) => t.id === id) ?? null;
  const editTask = dialog.kind === "edit" ? byId(dialog.taskId) : null;
  const fullscreenTask = fullscreenId ? byId(fullscreenId) : null;

  /* ---------- أفعال ---------- */

  const start = (name: string, back: number, cat: Category) => {
    update((s) => A.startTask(s, name, back, cat));
    toast(back > 0 ? `بدأت: ${name.trim()} (منذ ${back} دقيقة)` : `بدأت: ${name.trim()}`);
  };

  const proceed = (next: A.Next, endOverride?: string) => {
    const closeStatus = dialog.kind === "next" ? dialog.close : "interrupted";
    update((s) => A.closeAndProceed(s, closeStatus, next, endOverride));
    toast(
      next.type === "stop"
        ? "توقّف التسجيل"
        : closeStatus === "completed"
          ? "تم إنهاء المهمة والانتقال"
          : "تم تسجيل المقاطعة والانتقال",
    );
  };

  const resume = (id: string) => {
    const t = byId(id);
    if (!t) return;
    // شيء يعمل الآن: نسأل ماذا يحلّ به قبل البدء
    if (actives.length > 0) {
      setDialog({ kind: "startChoice", intent: { type: "resume", id, name: t.name } });
      return;
    }
    update((s) => A.resumeTask(s, id, false));
    toast(`استُؤنفت: ${t.name}`);
  };

  /** تنفيذ قرار ورقة «كيف تبدأ؟» */
  const decide = (
    intent: StartIntent,
    d: { kind: "parallel" } | { kind: "close"; status: "completed" | "interrupted" },
    memoId?: string,
  ) => {
    update((prev) => {
      let next =
        d.kind === "parallel"
          ? intent.type === "new"
            ? A.startParallel(prev, intent.name)
            : A.resumeTask(prev, intent.id, true)
          : A.closeAndProceed(
              prev,
              d.status,
              intent.type === "new"
                ? { type: "new", name: intent.name, category: "work", backMinutes: 0 }
                : { type: "resume", id: intent.id },
            );
      if (memoId) next = A.removeMemo(next, memoId);
      return next;
    });
    setDay(todayStr());
    toast(`بدأت: ${intent.name}`);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(String(e.target?.result ?? ""));
        update((s) => {
          const { state: merged, added } = mergeImported(s, raw);
          toast(added ? `تم استيراد ${added} مهمة` : "الملف لا يحتوي على مهام صالحة");
          return merged;
        });
      } catch {
        toast("تعذّرت قراءة الملف — تأكد أنه JSON صالح");
      }
    };
    reader.readAsText(file);
  };

  /* ---------- العرض ---------- */

  return (
    <div className="flex flex-col gap-4">
      <DayNav
        day={day}
        canNext={idx < days.length - 1}
        onPrev={() => setDay(addDays(day, -1))}
        onNext={() => idx < days.length - 1 && setDay(addDays(day, 1))}
        onToday={() => setDay(todayStr())}
        onMenu={() => setDialog({ kind: "menu" })}
      />

      <ViewTabs view={view} onChange={setView} />

      {view === "log" ? (
        <>
          {actives.length > 0
            ? actives.map((t, i) => (
                <NowCard
                  key={t.id}
                  task={t}
                  canAddParallel={i === actives.length - 1 && actives.length < MAX_PARALLEL}
                  onStep={() => setDialog({ kind: "step", taskId: t.id, taskName: t.name })}
                  onFinish={() =>
                    setDialog({ kind: "next", close: "completed", title: `إنهاء: ${t.name}` })
                  }
                  onInterrupt={() =>
                    setDialog({ kind: "next", close: "interrupted", title: `مقاطعة: ${t.name}` })
                  }
                  onParallel={() => setDialog({ kind: "parallel" })}
                  onFullscreen={() => setFullscreenId(t.id)}
                  onEdit={() =>
                    setDialog({ kind: "edit", taskId: t.id, segIdx: t.segments.length - 1 })
                  }
                />
              ))
            : isToday && <EmptyNow onStart={start} />}

          <Memos
            memos={state.memo}
            hasActive={actives.length > 0}
            onAdd={(text) => update((s) => A.addMemo(s, text))}
            onRemove={(id) => update((s) => A.removeMemo(s, id))}
            onStart={(m) => {
              if (actives.length === 0) {
                update((s) => A.removeMemo(A.startTask(s, m.text), m.id));
                toast(`بدأت: ${m.text}`);
              } else {
                setDialog({
                  kind: "startChoice",
                  intent: { type: "new", name: m.text },
                  memoId: m.id,
                });
              }
            }}
          />

          <PendingStack
            tasks={pending}
            onResume={(id) => setDialog({ kind: "pendingActions", taskId: id })}
            onDismiss={(id) => update((s) => A.dismissTask(s, id))}
          />

          <Summary stats={stats} />

          <Timeline
            rows={rows}
            onEdit={(taskId, segIdx) => setDialog({ kind: "edit", taskId, segIdx })}
            onInsert={(prevEnd, nextStart) => setDialog({ kind: "addPast", prevEnd, nextStart })}
            onRemoveStep={(taskId, i) => update((s) => A.removeStep(s, taskId, i))}
          />
        </>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-n-line p-1">
            {PERIODS.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPeriod(k)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                  period === k ? "bg-n-accent-soft font-medium text-n-accent" : "text-n-dim hover:text-n-text"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {period === "day" ? (
            <DayCharts
              tasks={state.tasks}
              day={day}
              now={now}
              onResume={(id) => setDialog({ kind: "pendingActions", taskId: id })}
            />
          ) : (
            <RangeCharts
              tasks={state.tasks}
              days={periodDays(period, day, state.tasks)}
              period={period}
              now={now}
            />
          )}
        </>
      )}

      <p className="pb-2 text-center text-[11px] text-n-faint">{SYNC_LABEL[sync]}</p>

      {/* ---------- النوافذ ---------- */}

      {dialog.kind === "step" && (
        <InputSheet
          title="خطوة فرعية جديدة"
          desc={`ضمن: ${dialog.taskName}`}
          placeholder="مثال: أرسلت المسودة للمراجعة"
          onConfirm={(text) => update((s) => A.addStep(s, dialog.taskId, text))}
          onClose={close}
        />
      )}

      {dialog.kind === "parallel" && (
        <NextSheet
          title="مهمة بالتوازي"
          current={null}
          pending={pending}
          onClose={close}
          onProceed={(next) => {
            if (next.type === "new") {
              update((s) => A.startParallel(s, next.name, next.category));
              toast(`بدأت بالتوازي: ${next.name.trim()}`);
            } else if (next.type === "resume") {
              update((s) => A.resumeTask(s, next.id, true));
              toast("استُؤنفت بالتوازي");
            }
          }}
        />
      )}

      {dialog.kind === "startChoice" && (
        <StartChoice
          intent={dialog.intent}
          actives={actives}
          onClose={close}
          onDecide={(d) => {
            if (dialog.kind !== "startChoice") return;
            decide(dialog.intent, d, dialog.memoId);
            close();
          }}
        />
      )}

      {dialog.kind === "pendingActions" && byId(dialog.taskId) && (
        <PendingActions
          task={byId(dialog.taskId)!}
          onClose={close}
          onResume={() => {
            const id = dialog.kind === "pendingActions" ? dialog.taskId : "";
            close();
            resume(id);
          }}
          onComplete={() => {
            if (dialog.kind !== "pendingActions") return;
            update((s) => A.setTaskStatus(s, dialog.taskId, "completed"));
            toast("سُجّلت مكتملة");
            close();
          }}
          onDismiss={() => {
            if (dialog.kind !== "pendingActions") return;
            update((s) => A.dismissTask(s, dialog.taskId));
            toast("أُزيلت من المعلّقة");
            close();
          }}
        />
      )}

      {dialog.kind === "next" && (
        <NextSheet
          title={dialog.title}
          current={actives[0] ?? null}
          pending={pending}
          onClose={close}
          onProceed={proceed}
        />
      )}

      {dialog.kind === "edit" && editTask && (
        <EditSheet
          task={editTask}
          segIdx={dialog.segIdx}
          onClose={close}
          onSave={(patch) => update((s) => A.editSegment(s, editTask.id, dialog.segIdx, patch))}
          onDeleteSegment={() => update((s) => A.deleteSegment(s, editTask.id, dialog.segIdx))}
          onDeleteTask={() => update((s) => A.deleteTask(s, editTask.id))}
          onSetStatus={(st) => update((s) => A.setTaskStatus(s, editTask.id, st))}
        />
      )}

      {dialog.kind === "addPast" && (
        <AddPastSheet
          prevEnd={dialog.prevEnd}
          nextStart={dialog.nextStart}
          onClose={close}
          onAdd={(name, s0, e0, cat) => {
            update((s) => A.addPastTask(s, name, s0, e0, cat));
            toast("أُضيفت المهمة");
          }}
        />
      )}

      {dialog.kind === "menu" && (
        <MenuSheet
          onClose={close}
          onPrint={() => window.print()}
          onExport={() => setDialog({ kind: "export" })}
          onImport={() => setDialog({ kind: "import" })}
          onClearDay={() =>
            setDialog({
              kind: "confirm",
              title: "مسح سجل هذا اليوم؟",
              desc: `سيُحذف نهائيًا كل ما سُجّل في ${arDate(day)}. لا يمكن التراجع.`,
              run: () => update((s) => A.clearDay(s, day)),
            })
          }
          onClearAll={() =>
            setDialog({
              kind: "confirm",
              title: "مسح جميع السجلات؟",
              desc: "سيُحذف كل شيء سجّلته منذ البداية، لكل الأيام بلا استثناء.",
              run: () => update(() => A.clearAll()),
            })
          }
        />
      )}

      {dialog.kind === "export" && (
        <ExportSheet
          dayLabel={arDate(day)}
          onClose={close}
          onExport={(kind: ExportKind) => {
            runExport(kind, state, day);
            toast("تم تجهيز الملف");
          }}
        />
      )}

      {dialog.kind === "import" && <ImportSheet onClose={close} onFile={importFile} />}

      {dialog.kind === "confirm" && (
        <ConfirmSheet
          title={dialog.title}
          desc={dialog.desc}
          onConfirm={dialog.run}
          onClose={close}
        />
      )}

      {fullscreenTask && (
        <FullscreenTimer task={fullscreenTask} onClose={() => setFullscreenId(null)} />
      )}

      <Toast message={message} />
    </div>
  );
}
