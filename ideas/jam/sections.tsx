"use client";

import { useCallback, useState } from "react";

import type { Department, Member, Settings } from "./types";
import {
  fetchAchievements,
  fetchAids,
  fetchBeneficiaries,
  fetchChains,
  fetchIndicators,
  fetchObjectives,
  fetchPerspectives,
  fetchDocs,
  fetchDonors,
  fetchGrants,
  fetchLeaves,
  fetchLedger,
  fetchMail,
  fetchMailReads,
  fetchMeetings,
  fetchNews,
  fetchPolicies,
  fetchPrograms,
  fetchRequests,
  fetchShifts,
  fetchSurveys,
  fetchSites,
  fetchTasks,
} from "./db";
import { useLive } from "./hooks";
import { fetchAttendance } from "./db";
import { Loading } from "./ui";

import { AttendanceScreen } from "./screens/Attendance";
import { Beneficiaries } from "./screens/Beneficiaries";
import { Chains } from "./screens/Chains";
import { Documents } from "./screens/Documents";
import { Donors } from "./screens/Donors";
import { Grants } from "./screens/Grants";
import { Leaves } from "./screens/Leaves";
import { Ledger } from "./screens/Ledger";
import { Mail } from "./screens/Mail";
import { Meetings } from "./screens/Meetings";
import { Members } from "./screens/Members";
import { News } from "./screens/News";
import { OrgSettings } from "./screens/OrgSettings";
import { Policies } from "./screens/Policies";
import { Programs } from "./screens/Programs";
import { Requests } from "./screens/Requests";
import { Strategy } from "./screens/Strategy";
import { Structure } from "./screens/Structure";
import { Tracking } from "./screens/Tracking";
import { Surveys } from "./screens/Surveys";
import { Tasks } from "./screens/Tasks";

/** ما يشترك فيه كل قسم: الفريق والبنية والإعدادات */
export type Core = {
  settings: Settings | null;
  members: Member[];
  departments: Department[];
  me: string | null;
  today: string;
  refreshCore: () => void;
};

/**
 * كل قسم يحمّل جداوله حين يُفتح، فلا يفتح النظام
 * عشرين اتصالًا حيًّا لأجل شاشة واحدة.
 */
function Shown({
  error,
  loading,
  children,
}: {
  error: string | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-j-danger/30 bg-j-danger/5 p-5">
        <p className="text-sm font-semibold text-j-danger">تعذّر الوصول إلى البيانات</p>
        <p className="mt-1 text-xs leading-relaxed text-j-dim">{error}</p>
      </div>
    );
  }
  if (loading) return <Loading />;
  return <>{children}</>;
}

export function TasksSection({ core }: { core: Core }) {
  const tasks = useLive("jam_tasks", fetchTasks);
  const meetings = useLive("jam_meetings", fetchMeetings);
  return (
    <Shown error={tasks.error ?? meetings.error} loading={tasks.loading || meetings.loading}>
      <Tasks
        tasks={tasks.data ?? []}
        members={core.members}
        departments={core.departments}
        meetings={meetings.data ?? []}
        onChanged={tasks.refresh}
      />
    </Shown>
  );
}

export function RequestsSection({ core }: { core: Core }) {
  const req = useLive("jam_requests", fetchRequests);
  const chains = useLive("jam_chains", fetchChains);
  return (
    <Shown error={req.error ?? chains.error} loading={req.loading || chains.loading}>
      <Requests
        requests={req.data ?? []}
        members={core.members}
        chains={chains.data ?? []}
        onChanged={req.refresh}
      />
    </Shown>
  );
}

export function MeetingsSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_meetings", fetchMeetings);
  return (
    <Shown error={error} loading={loading}>
      <Meetings
        meetings={data ?? []}
        members={core.members}
        departments={core.departments}
        me={core.me}
        onChanged={refresh}
      />
    </Shown>
  );
}

export function MembersSection({ core }: { core: Core }) {
  const shifts = useLive("jam_shifts", fetchShifts);
  return (
    <Shown error={shifts.error} loading={shifts.loading}>
      <Members
        members={core.members}
        departments={core.departments}
        shifts={shifts.data ?? []}
        onChanged={core.refreshCore}
      />
    </Shown>
  );
}

export function AttendanceSection({ core }: { core: Core }) {
  const [day, setDay] = useState(core.today);
  const sites = useLive("jam_sites", fetchSites);
  const shifts = useLive("jam_shifts", fetchShifts);
  const leaves = useLive("jam_leaves", fetchLeaves);

  /** سجلّات يومٍ واحد — تُجلب بنفسها لأنّ المفتاح هو التاريخ لا الجدول */
  const load = useCallback(() => fetchAttendance(day), [day]);
  const recs = useLive("jam_attendance", load);

  return (
    <Shown
      error={recs.error ?? sites.error ?? shifts.error ?? leaves.error}
      loading={recs.loading || sites.loading || shifts.loading || leaves.loading}
    >
      <AttendanceScreen
        day={day}
        setDay={setDay}
        records={recs.data ?? []}
        members={core.members}
        shifts={shifts.data ?? []}
        sites={sites.data ?? []}
        leaves={leaves.data ?? []}
        onChanged={recs.refresh}
      />
    </Shown>
  );
}

export function LeavesSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_leaves", fetchLeaves);
  return (
    <Shown error={error} loading={loading}>
      <Leaves
        leaves={data ?? []}
        members={core.members}
        me={core.me}
        today={core.today}
        onChanged={refresh}
      />
    </Shown>
  );
}

export function BeneficiariesSection({ core }: { core: Core }) {
  const ben = useLive("jam_beneficiaries", fetchBeneficiaries);
  const aids = useLive("jam_aids", fetchAids);
  const progs = useLive("jam_programs", fetchPrograms);
  return (
    <Shown
      error={ben.error ?? aids.error ?? progs.error}
      loading={ben.loading || aids.loading || progs.loading}
    >
      <Beneficiaries
        beneficiaries={ben.data ?? []}
        members={core.members}
        aids={aids.data ?? []}
        programs={progs.data ?? []}
        onChanged={() => {
          ben.refresh();
          aids.refresh();
        }}
      />
    </Shown>
  );
}

export function ProgramsSection({ core }: { core: Core }) {
  const progs = useLive("jam_programs", fetchPrograms);
  const aids = useLive("jam_aids", fetchAids);
  return (
    <Shown error={progs.error ?? aids.error} loading={progs.loading || aids.loading}>
      <Programs
        programs={progs.data ?? []}
        aids={aids.data ?? []}
        members={core.members}
        departments={core.departments}
        onChanged={progs.refresh}
      />
    </Shown>
  );
}

export function DonorsSection() {
  const donors = useLive("jam_donors", fetchDonors);
  const grants = useLive("jam_grants", fetchGrants);
  return (
    <Shown error={donors.error ?? grants.error} loading={donors.loading || grants.loading}>
      <Donors donors={donors.data ?? []} grants={grants.data ?? []} onChanged={donors.refresh} />
    </Shown>
  );
}

export function GrantsSection({ core }: { core: Core }) {
  const grants = useLive("jam_grants", fetchGrants);
  const donors = useLive("jam_donors", fetchDonors);
  const progs = useLive("jam_programs", fetchPrograms);
  return (
    <Shown
      error={grants.error ?? donors.error ?? progs.error}
      loading={grants.loading || donors.loading || progs.loading}
    >
      <Grants
        grants={grants.data ?? []}
        donors={donors.data ?? []}
        programs={progs.data ?? []}
        members={core.members}
        onChanged={grants.refresh}
      />
    </Shown>
  );
}

export function LedgerSection({ core }: { core: Core }) {
  const led = useLive("jam_ledger", fetchLedger);
  const progs = useLive("jam_programs", fetchPrograms);
  const grants = useLive("jam_grants", fetchGrants);
  return (
    <Shown
      error={led.error ?? progs.error ?? grants.error}
      loading={led.loading || progs.loading || grants.loading}
    >
      <Ledger
        entries={led.data ?? []}
        programs={progs.data ?? []}
        grants={grants.data ?? []}
        settings={core.settings}
        me={core.me}
        onChanged={led.refresh}
      />
    </Shown>
  );
}

export function MailSection({ core }: { core: Core }) {
  const mail = useLive("jam_mail", fetchMail);
  const reads = useLive("jam_mail_reads", fetchMailReads);
  return (
    <Shown error={mail.error ?? reads.error} loading={mail.loading || reads.loading}>
      <Mail
        mail={mail.data ?? []}
        reads={reads.data ?? []}
        members={core.members}
        me={core.me}
        onChanged={() => {
          mail.refresh();
          reads.refresh();
        }}
      />
    </Shown>
  );
}

export function PoliciesSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_policies", fetchPolicies);
  return (
    <Shown error={error} loading={loading}>
      <Policies policies={data ?? []} members={core.members} onChanged={refresh} />
    </Shown>
  );
}

export function DocumentsSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_documents", fetchDocs);
  return (
    <Shown error={error} loading={loading}>
      <Documents docs={data ?? []} members={core.members} me={core.me} onChanged={refresh} />
    </Shown>
  );
}

export function NewsSection({ core }: { core: Core }) {
  const news = useLive("jam_news", fetchNews);
  const wins = useLive("jam_achievements", fetchAchievements);
  const progs = useLive("jam_programs", fetchPrograms);
  return (
    <Shown
      error={news.error ?? wins.error ?? progs.error}
      loading={news.loading || wins.loading || progs.loading}
    >
      <News
        news={news.data ?? []}
        achievements={wins.data ?? []}
        members={core.members}
        programs={progs.data ?? []}
        onChanged={() => {
          news.refresh();
          wins.refresh();
        }}
      />
    </Shown>
  );
}

/** مفتاحه يتغيّر حين تصل الإعدادات، فيُركَّب النموذج على قيمها */
export function OrgSection({ core }: { core: Core }) {
  return (
    <OrgSettings
      key={core.settings ? "loaded" : "empty"}
      settings={core.settings}
      onChanged={core.refreshCore}
    />
  );
}

export function StructureSection({ core }: { core: Core }) {
  const shifts = useLive("jam_shifts", fetchShifts);
  const sites = useLive("jam_sites", fetchSites);
  return (
    <Shown error={shifts.error ?? sites.error} loading={shifts.loading || sites.loading}>
      <Structure
        departments={core.departments}
        shifts={shifts.data ?? []}
        sites={sites.data ?? []}
        members={core.members}
        onChanged={() => {
          core.refreshCore();
          shifts.refresh();
          sites.refresh();
        }}
      />
    </Shown>
  );
}

export function SurveysSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_surveys", fetchSurveys);
  return (
    <Shown error={error} loading={loading}>
      <Surveys
        surveys={data ?? []}
        members={core.members}
        me={core.me}
        onChanged={refresh}
      />
    </Shown>
  );
}

/** الخطة ومتابعتها يقرآن الشجرة نفسها، فتُجمع قراءتها في خطّاف واحد */
function usePlanTree() {
  const perspectives = useLive("jam_perspectives", fetchPerspectives);
  const objectives = useLive("jam_objectives", fetchObjectives);
  const indicators = useLive("jam_indicators", fetchIndicators);
  return {
    error: perspectives.error ?? objectives.error ?? indicators.error,
    loading: perspectives.loading || objectives.loading || indicators.loading,
    perspectives: perspectives.data ?? [],
    objectives: objectives.data ?? [],
    indicators: indicators.data ?? [],
    refresh: () => {
      perspectives.refresh();
      objectives.refresh();
      indicators.refresh();
    },
  };
}

export function StrategySection() {
  const t = usePlanTree();
  return (
    <Shown error={t.error} loading={t.loading}>
      <Strategy
        perspectives={t.perspectives}
        objectives={t.objectives}
        indicators={t.indicators}
        onChanged={t.refresh}
      />
    </Shown>
  );
}

export function TrackingSection() {
  const t = usePlanTree();
  return (
    <Shown error={t.error} loading={t.loading}>
      <Tracking
        perspectives={t.perspectives}
        objectives={t.objectives}
        indicators={t.indicators}
      />
    </Shown>
  );
}

export function ChainsSection({ core }: { core: Core }) {
  const { data, loading, error, refresh } = useLive("jam_chains", fetchChains);
  return (
    <Shown error={error} loading={loading}>
      <Chains chains={data ?? []} members={core.members} onChanged={refresh} />
    </Shown>
  );
}
