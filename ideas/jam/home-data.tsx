"use client";

import { useCallback, useState } from "react";
import type {
  Attendance,
  Grant,
  LedgerEntry,
  Meeting,
  Policy,
  Program,
  Request,
  Task,
} from "./types";
import {
  fetchAttendance,
  fetchGrants,
  fetchLedger,
  fetchMeetings,
  fetchPolicies,
  fetchPrograms,
  fetchRequests,
  fetchTasks,
} from "./db";
import { useLive } from "./hooks";
import { Loading } from "./ui";
import type { Core } from "./sections";

export type HomeSlice = {
  tasks: Task[];
  requests: Request[];
  attendance: Attendance[];
  meetings: Meeting[];
  programs: Program[];
  grants: Grant[];
  ledger: LedgerEntry[];
  policies: Policy[];
};

/**
 * اللوحة تقرأ من ثمانية جداول. تُفصل قراءتها هنا
 * فلا تُحمَّل إلّا حين تُفتح اللوحة.
 */
export function HomeData({
  core,
  children,
}: {
  core: Core;
  children: (d: HomeSlice) => React.ReactNode;
}) {
  const [day] = useState(core.today);
  const loadAttendance = useCallback(() => fetchAttendance(day), [day]);

  const tasks = useLive("jam_tasks", fetchTasks);
  const requests = useLive("jam_requests", fetchRequests);
  const attendance = useLive("jam_attendance", loadAttendance);
  const meetings = useLive("jam_meetings", fetchMeetings);
  const programs = useLive("jam_programs", fetchPrograms);
  const grants = useLive("jam_grants", fetchGrants);
  const ledger = useLive("jam_ledger", fetchLedger);
  const policies = useLive("jam_policies", fetchPolicies);

  const loading =
    tasks.loading ||
    requests.loading ||
    attendance.loading ||
    meetings.loading ||
    programs.loading ||
    grants.loading ||
    ledger.loading ||
    policies.loading;

  if (loading) return <Loading />;

  return (
    <>
      {children({
        tasks: tasks.data ?? [],
        requests: requests.data ?? [],
        attendance: attendance.data ?? [],
        meetings: meetings.data ?? [],
        programs: programs.data ?? [],
        grants: grants.data ?? [],
        ledger: ledger.data ?? [],
        policies: policies.data ?? [],
      })}
    </>
  );
}
