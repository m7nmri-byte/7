"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useStandalone } from "@/lib/standalone";
import {
  fetchDepartments,
  patch,
  fetchMail,
  fetchMailReads,
  fetchMembers,
  fetchRequests,
  fetchSettings,
  fetchTasks,
} from "./db";
import { setMe, today as todayOf, useLive, useMe } from "./hooks";
import { Body, FailureBar, PageHead, Shell } from "./ui";
import { Sidebar } from "./Sidebar";
import { navItem, type SectionKey } from "./nav";
import { Home } from "./screens/Home";
import { HomeData } from "./home-data";
import type { Core } from "./sections";
import {
  AttendanceSection,
  BeneficiariesSection,
  ChainsSection,
  DocumentsSection,
  DonorsSection,
  GrantsSection,
  LeavesSection,
  LedgerSection,
  MailSection,
  MeetingsSection,
  MembersSection,
  NewsSection,
  OrgSection,
  PoliciesSection,
  ProgramsSection,
  RequestsSection,
  StrategySection,
  StructureSection,
  TrackingSection,
  SurveysSection,
  TasksSection,
} from "./sections";

export default function JamView() {
  const [section, setSection] = useState<SectionKey>("home");
  const me = useMe();
  const { session, checking } = useSession();
  const standalone = useStandalone();

  /** اليوم يُحسب مرّة عند التركيب — لا في كل تصيير */
  const [today] = useState(todayOf);

  const settings = useLive("jam_settings", fetchSettings);
  const members = useLive("jam_members", fetchMembers);
  const departments = useLive("jam_departments", fetchDepartments);

  const refreshCore = useCallback(() => {
    settings.refresh();
    members.refresh();
    departments.refresh();
  }, [settings, members, departments]);

  const core: Core = useMemo(
    () => ({
      settings: settings.data ?? null,
      members: members.data ?? [],
      departments: departments.data ?? [],
      me,
      today,
      refreshCore,
    }),
    [settings.data, members.data, departments.data, me, today, refreshCore],
  );

  /** شارات القائمة: ما ينتظرني فقط، فلا تضجّ القائمة بأرقام لا تعنيني */
  const inbox = useLive("jam_requests", fetchRequests);
  const myTasks = useLive("jam_tasks", fetchTasks);
  const mail = useLive("jam_mail", fetchMail);
  const reads = useLive("jam_mail_reads", fetchMailReads);

  const badges = useMemo(() => {
    const reqs = (inbox.data ?? []).filter(
      (r) => r.status === "pending" && (r.current_reviewer === me || r.delegated_to === me),
    ).length;
    const tasks = (myTasks.data ?? []).filter(
      (t) => t.assignee_id === me && t.status !== "done",
    ).length;
    /** غير المقروء: ما وُجّه إليّ ولا سجلّ قراءة لي عليه */
    const seen = new Set(
      (reads.data ?? []).filter((r) => r.member_id === me).map((r) => r.mail_id),
    );
    const unread =
      me === null
        ? 0
        : (mail.data ?? []).filter(
            (m) => (m.to_ids.includes(me) || m.cc_ids.includes(me)) && !seen.has(m.id),
          ).length;

    return { requests: reqs, tasks, mail: unread };
  }, [inbox.data, myTasks.data, mail.data, reads.data, me]);

  /**
   * ربط الهويّة بالجلسة.
   *
   * `user_id` كان عمودًا بلا مستعمل، والهويّة تُختار يدويًا في كل
   * جهاز. ومع اشتراط تسجيل الدخول، صار العضو يُعرف من جلسته:
   * بالمعرّف إن سبق الربط، وإلّا بالبريد — ويُثبّت المعرّف وقتها
   * فلا يُسأل مرّة أخرى.
   */
  const membersFlat = core.members;
  useEffect(() => {
    if (!session || me) return;
    const byId = membersFlat.find((m) => m.user_id === session.user.id);
    if (byId) {
      setMe(byId.id);
      return;
    }
    const email = session.user.email?.trim().toLowerCase();
    if (!email) return;
    const byEmail = membersFlat.find((m) => (m.email ?? "").trim().toLowerCase() === email);
    if (!byEmail) return;
    setMe(byEmail.id);
    void patch("jam_members", byEmail.id, { user_id: session.user.id }).catch(() => {});
  }, [session, me, membersFlat]);

  const item = navItem(section);
  const coreError = settings.error ?? members.error ?? departments.error;

  return (
    <Shell
      nav={
        <Sidebar
          section={section}
          onGo={setSection}
          settings={core.settings}
          members={core.members}
          me={me}
          badges={badges}
        />
      }
    >
      <PageHead title={item.title} subtitle={item.subtitle} />
      <FailureBar />

      <Body>
        {coreError ? (
          <div className="mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-j-danger/30 bg-j-danger/5 p-6">
            <p className="text-sm font-semibold text-j-danger">
              {checking
                ? "جارٍ التحقّق من الجلسة…"
                : session
                  ? "تعذّر الوصول إلى البيانات"
                  : "هذا النظام يلزمه تسجيل دخول"}
            </p>

            {/* بيانات الجمعية مقصورة على من سجّل دخوله، فالرسالة تميّز
                بين «لم تسجّل» و«سجّلت ومع ذلك مُنعت» */}
            {!checking && !session ? (
              <>
                <p className="text-xs leading-relaxed text-j-dim">
                  بيانات الجمعية — أسماء المستفيدين والقيود المالية والمحاضر — مقصورة
                  على من سجّل دخوله. الدخول مرّة واحدة من الموقع الأساسي، وتقرأ منه
                  الأدوات كلّها.
                </p>
                {/* التطبيق المثبّت لا يخرج إلى الموقع الأساسي، فلا رابط فيه */}
                {standalone ? (
                  <p className="text-xs leading-relaxed text-j-faint">
                    سجّل الدخول من الموقع في المتصفّح، ثم عُد إلى هذا التطبيق.
                  </p>
                ) : (
                  <a
                    href="/login"
                    className="self-start rounded-xl bg-j-brand px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    سجّل الدخول
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-j-dim">{coreError}</p>
                <p className="text-xs leading-relaxed text-j-faint">
                  إن كانت الرسالة عن صلاحية، فجداول jam_‎* لم تُمنح بعد صلاحية القراءة.
                  أمرها في ideas/jam/sql/grants.sql.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {section === "home" && (
              <HomeData core={core}>
                {(d) => (
                  <Home
                    settings={core.settings}
                    me={me}
                    members={core.members}
                    today={today}
                    go={(s) => setSection(s as SectionKey)}
                    {...d}
                  />
                )}
              </HomeData>
            )}
            {section === "tasks" && <TasksSection core={core} />}
            {section === "requests" && <RequestsSection core={core} />}
            {section === "meetings" && <MeetingsSection core={core} />}
            {section === "members" && <MembersSection core={core} />}
            {section === "attendance" && <AttendanceSection core={core} />}
            {section === "leaves" && <LeavesSection core={core} />}
            {section === "strategy" && <StrategySection />}
            {section === "tracking" && <TrackingSection />}
            {section === "beneficiaries" && <BeneficiariesSection core={core} />}
            {section === "programs" && <ProgramsSection core={core} />}
            {section === "donors" && <DonorsSection />}
            {section === "grants" && <GrantsSection core={core} />}
            {section === "ledger" && <LedgerSection core={core} />}
            {section === "mail" && <MailSection core={core} />}
            {section === "policies" && <PoliciesSection core={core} />}
            {section === "documents" && <DocumentsSection core={core} />}
            {section === "news" && <NewsSection core={core} />}
            {section === "surveys" && <SurveysSection core={core} />}
            {section === "org" && <OrgSection core={core} />}
            {section === "structure" && <StructureSection core={core} />}
            {section === "chains" && <ChainsSection core={core} />}
          </>
        )}
      </Body>
    </Shell>
  );
}
