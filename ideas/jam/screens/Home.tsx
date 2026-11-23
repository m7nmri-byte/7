"use client";

import { useMemo } from "react";
import type {
  Attendance,
  Grant,
  LedgerEntry,
  Meeting,
  Member,
  Policy,
  Program,
  Request,
  Settings,
  Task,
} from "../types";
import { daysUntil, fmtDate, fmtTime, money } from "../format";
import { Stat } from "../ui";
import { awaitsMe } from "./request-core";

type Row = { label: string; value: string; tone?: string; hint?: string };

/** بطاقة قائمة مختصرة — تُستخرج لأنّ اللوحة كلّها قوائم قصيرة */
function Panel({
  title,
  rows,
  empty,
  onOpen,
}: {
  title: string;
  rows: Row[];
  empty: string;
  onOpen?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-j-line bg-j-surface p-4 shadow-j-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-j-dim">{title}</span>
        {onOpen && (
          <button onClick={onOpen} className="text-[11px] text-j-brand">
            الكل
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-j-faint">{empty}</p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <div
              key={r.label + i}
              className={
                "flex items-baseline gap-3 py-2 " + (i > 0 ? "border-t border-j-line/60" : "")
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{r.label}</span>
                {r.hint && (
                  <span className="block truncate text-[10px] text-j-faint">{r.hint}</span>
                )}
              </span>
              <span
                className="mark shrink-0 text-[11px] font-medium"
                style={{ color: r.tone ?? "var(--j-dim)" }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Home({
  settings,
  me,
  members,
  tasks,
  requests,
  attendance,
  meetings,
  programs,
  grants,
  ledger,
  policies,
  today,
  go,
}: {
  settings: Settings | null;
  me: string | null;
  members: Member[];
  tasks: Task[];
  requests: Request[];
  attendance: Attendance[];
  meetings: Meeting[];
  programs: Program[];
  grants: Grant[];
  ledger: LedgerEntry[];
  policies: Policy[];
  today: string;
  go: (section: string) => void;
}) {
  const nameOf = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : "—";

  /** مهامي المفتوحة، المتأخّرة أوّلًا */
  const myTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.assignee_id === me && t.status !== "done")
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
        .slice(0, 5)
        .map((t) => {
          const d = t.due_date ? daysUntil(t.due_date) : null;
          return {
            label: t.title,
            value: d === null ? "—" : d < 0 ? "تأخّرت " + -d : d === 0 ? "اليوم" : "بعد " + d,
            tone: d !== null && d < 0 ? "var(--j-danger)" : d === 0 ? "var(--j-warn)" : undefined,
          };
        }),
    [tasks, me],
  );

  const myInbox = useMemo(
    () =>
      requests
        .filter((r) => awaitsMe(r, me))
        .slice(0, 5)
        .map((r) => ({
          label: r.title,
          value: r.amount != null ? money(r.amount) : "#" + r.number,
          hint: members.find((m) => m.id === r.created_by)?.name,
          tone: "var(--j-warn)",
        })),
    [requests, me, members],
  );

  const todayAttendance = useMemo(() => {
    const present = attendance.filter((a) => a.work_date === today);
    const late = present.filter((a) => a.status === "late").length;
    const absent = members.filter(
      (m) => m.is_active && !present.some((a) => a.member_id === m.id),
    ).length;
    return { present: present.length, late, absent };
  }, [attendance, members, today]);

  const upcoming = useMemo(
    () =>
      meetings
        .filter((m) => m.held_at.slice(0, 10) >= today)
        .sort((a, b) => a.held_at.localeCompare(b.held_at))
        .slice(0, 4)
        .map((m) => ({
          label: m.title,
          value: fmtTime(m.held_at),
          hint: fmtDate(m.held_at) + (m.location ? " · " + m.location : ""),
        })),
    [meetings, today],
  );

  /** المالية: الشهر الجاري فقط، فاللوحة تجيب «كيف نحن الآن» */
  const monthMoney = useMemo(() => {
    const from = today.slice(0, 7);
    let income = 0;
    let expense = 0;
    for (const e of ledger) {
      if (!e.entry_date.startsWith(from)) continue;
      if (e.kind === "income") income += Number(e.amount);
      else expense += Number(e.amount);
    }
    return { income, expense, net: income - expense };
  }, [ledger, today]);

  const running = useMemo(() => programs.filter((p) => p.status === "running"), [programs]);

  const pipeline = useMemo(
    () =>
      grants
        .filter((g) => g.status === "submitted" || g.status === "under_review")
        .slice(0, 4)
        .map((g) => ({
          label: g.title,
          value: money(g.requested),
          hint: g.closes_at ? "يُغلق " + fmtDate(g.closes_at) : undefined,
        })),
    [grants],
  );

  const reviewDue = useMemo(
    () =>
      policies
        .filter((p) => p.review_due && daysUntil(p.review_due) <= 30)
        .slice(0, 4)
        .map((p) => {
          const d = p.review_due ? daysUntil(p.review_due) : 0;
          return {
            label: p.title,
            value: d < 0 ? "تأخّرت " + -d : "بعد " + d,
            tone: d < 0 ? "var(--j-danger)" : "var(--j-warn)",
          };
        }),
    [policies],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{settings?.name || "الجمعية"}</h2>
        {me ? (
          <p className="text-xs text-j-dim">مرحبًا {nameOf(me)}</p>
        ) : (
          <p className="text-xs text-j-warn">اختر هويّتك من أعلى ليظهر ما يخصّك</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="بانتظار اعتمادي"
          value={requests.filter((r) => awaitsMe(r, me)).length}
          tone="var(--j-warn)"
        />
        <Stat
          label="مهامي المفتوحة"
          value={tasks.filter((t) => t.assignee_id === me && t.status !== "done").length}
        />
        <Stat label="حضور اليوم" value={todayAttendance.present} tone="var(--j-ok)" />
        <Stat
          label="صافي الشهر"
          value={money(monthMoney.net)}
          tone={monthMoney.net < 0 ? "var(--j-danger)" : "var(--j-brand)"}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="بانتظار اعتمادي"
          rows={myInbox}
          empty="لا شيء ينتظرك"
          onOpen={() => go("requests")}
        />
        <Panel title="مهامي" rows={myTasks} empty="لا مهام مفتوحة" onOpen={() => go("tasks")} />
        <Panel
          title="الاجتماعات القادمة"
          rows={upcoming}
          empty="لا اجتماعات قادمة"
          onOpen={() => go("meetings")}
        />
        <Panel
          title="حضور اليوم"
          rows={[
            { label: "حاضر", value: String(todayAttendance.present), tone: "var(--j-ok)" },
            { label: "متأخّر", value: String(todayAttendance.late), tone: "var(--j-warn)" },
            { label: "لم يبصم", value: String(todayAttendance.absent), tone: "var(--j-danger)" },
          ]}
          empty=""
          onOpen={() => go("attendance")}
        />
        <Panel
          title="منح قيد السعي"
          rows={pipeline}
          empty="لا منح مُقدَّمة"
          onOpen={() => go("grants")}
        />
        <Panel
          title="سياسات تحتاج مراجعة"
          rows={reviewDue}
          empty="لا شيء قارب موعده"
          onOpen={() => go("policies")}
        />
      </div>

      {running.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold text-j-dim">برامج جارية</span>
            <span className="h-px flex-1 bg-j-line" />
            <button onClick={() => go("programs")} className="text-[11px] text-j-brand">
              الكل
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {running.map((p) => (
              <button
                key={p.id}
                onClick={() => go("programs")}
                className="flex flex-col gap-2 rounded-2xl border border-j-line bg-j-surface p-4 text-start shadow-j-sm"
              >
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="mark text-xs text-j-dim">ميزانية {money(p.budget)}</span>
                {p.end_date && (
                  <span className="mark text-[11px] text-j-faint">ينتهي {fmtDate(p.end_date)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
