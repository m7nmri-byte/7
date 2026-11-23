"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Attendance as Rec, Leave, Member, Shift, Site } from "../types";
import { ATTENDANCE_STATUS } from "../types";
import { fmtTime } from "../format";
import { today, useMe } from "../hooks";
import { Card, Empty, Stat, Tag, jField, jGhost, jPrimary } from "../ui";
import { isWorkDay, statusFor, summarize, verdictFor } from "./attend-core";

const TONE: Record<string, string> = {
  present: "var(--j-ok)",
  late: "var(--j-warn)",
  remote: "var(--j-info)",
  leave: "var(--j-faint)",
  absent: "var(--j-danger)",
  holiday: "var(--j-faint)",
};

export function AttendanceScreen({
  day,
  setDay,
  records,
  members,
  shifts,
  sites,
  leaves,
  onChanged,
}: {
  day: string;
  setDay: (d: string) => void;
  records: Rec[];
  members: Member[];
  shifts: Shift[];
  sites: Site[];
  leaves: Leave[];
  onChanged: () => void;
}) {
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const active = members.filter((m) => m.is_active);
  const onLeaveIds = new Set(
    leaves.filter((l) => l.approved && l.start_date <= day && l.end_date >= day).map((l) => l.member_id),
  );
  /**
   * المقام أعضاء مفعَّلون، فليُحصَ منهم من في إجازة لا من الكلّ —
   * وإلّا نقص الغائبون بقدر كل عضوٍ موقوف صادف أن له إجازة.
   */
  const onLeaveActive = active.filter((m) => onLeaveIds.has(m.id)).length;
  const sum = summarize(records, active.length, onLeaveActive);

  const myRecord = records.find((r) => r.member_id === me) ?? null;
  const myShift = shifts.find((s) => s.id === members.find((m) => m.id === me)?.shift_id) ?? null;

  /** البصمة: تُقرأ الإحداثيات فتُحسب أقرب موقع ومسافته */
  const punch = async (kind: "in" | "out") => {
    if (!me) {
      setMsg("اختر هويّتك من شاشة الموظفين أولًا");
      return;
    }
    setBusy(true);
    setMsg(null);

    const coords = await new Promise<GeolocationPosition | null>((res) => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(res, () => res(null), {
        enableHighAccuracy: true,
        timeout: 10_000,
      });
    });

    const at = coords
      ? { lat: coords.coords.latitude, lng: coords.coords.longitude }
      : null;

    /** القبول أو الرفض قرارٌ واحد في attend-core، لا حسابٌ متفرّق هنا */
    const verdict = verdictFor(
      sites,
      at,
      Boolean(members.find((m) => m.id === me)?.remote_allowed),
    );

    if (!verdict.ok) {
      setBusy(false);
      setMsg(verdict.reason);
      return;
    }

    const remote = verdict.remote;

    const base = {
      member_id: me,
      work_date: day,
      site_id: verdict.site?.id ?? null,
    };

    const payload: Record<string, unknown> =
      kind === "in"
        ? {
            ...base,
            check_in_at: new Date().toISOString(),
            check_in_lat: at?.lat ?? null,
            check_in_lng: at?.lng ?? null,
            check_in_distance_m: verdict.distance,
            status: statusFor(myShift, new Date(), remote),
            is_remote: remote,
          }
        : {
            ...base,
            check_out_at: new Date().toISOString(),
            check_out_lat: at?.lat ?? null,
            check_out_lng: at?.lng ?? null,
            check_out_distance_m: verdict.distance,
          };

    const { error } = await supabase
      .from("jam_attendance")
      .upsert(payload, { onConflict: "member_id,work_date" });

    setBusy(false);
    setMsg(error ? error.message : kind === "in" ? "سُجّل حضورك" : "سُجّل انصرافك");
    onChanged();
  };

  const workDay = isWorkDay(myShift, new Date(`${day}T12:00:00`));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          className={`${jField} max-w-44`}
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
        <button onClick={() => setDay(today())} className={jGhost}>
          اليوم
        </button>

        {day === today() && (
          <div className="ms-auto flex gap-2">
            <button
              disabled={busy || Boolean(myRecord?.check_in_at)}
              onClick={() => void punch("in")}
              className={jPrimary}
            >
              {myRecord?.check_in_at ? `حضرت ${fmtTime(myRecord.check_in_at)}` : "بصمة حضور"}
            </button>
            <button
              disabled={busy || !myRecord?.check_in_at || Boolean(myRecord?.check_out_at)}
              onClick={() => void punch("out")}
              className={jGhost}
            >
              {myRecord?.check_out_at ? `انصرفت ${fmtTime(myRecord.check_out_at)}` : "بصمة انصراف"}
            </button>
          </div>
        )}
      </div>

      {msg && (
        <p className="rounded-xl bg-j-brand-soft px-3 py-2.5 text-xs text-j-brand">{msg}</p>
      )}

      {!workDay && (
        <p className="rounded-xl bg-j-raised px-3 py-2.5 text-xs text-j-dim">
          هذا اليوم ليس يوم عمل في مجموعتك
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="حاضر" value={sum.present} tone={TONE.present} />
        <Stat label="متأخّر" value={sum.late} tone={TONE.late} />
        <Stat label="عن بُعد" value={sum.remote} tone={TONE.remote} />
        <Stat label="إجازة" value={sum.leave} />
        <Stat label="غائب" value={sum.absent} tone={TONE.absent} />
      </div>

      <Card title="سجلّ اليوم">
        {active.length === 0 ? (
          <Empty title="لا موظفين" />
        ) : (
          <div className="flex flex-col divide-y divide-j-line-soft">
            {active.map((m) => {
              const r = records.find((x) => x.member_id === m.id);
              const onLeave = onLeaveIds.has(m.id);
              const status = onLeave ? "leave" : (r?.status ?? "absent");
              return (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 truncate text-sm">{m.name}</span>
                  <span className="mark w-16 text-xs text-j-faint">
                    {r?.check_in_at ? fmtTime(r.check_in_at) : "—"}
                  </span>
                  <span className="mark w-16 text-xs text-j-faint">
                    {r?.check_out_at ? fmtTime(r.check_out_at) : "—"}
                  </span>
                  <Tag tone={TONE[status]}>
                    {onLeave ? "إجازة" : ATTENDANCE_STATUS[status as keyof typeof ATTENDANCE_STATUS]}
                  </Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
