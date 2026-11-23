import { supabase } from "@/lib/supabase";
import { reportWrite } from "@/lib/failures";
import type {
  Achievement,
  Aid,
  Attendance,
  Beneficiary,
  Chain,
  ChainStep,
  Department,
  Doc,
  Donor,
  Grant,
  LedgerEntry,
  Leave,
  Mail,
  MailRead,
  Meeting,
  Member,
  NewsItem,
  Policy,
  Program,
  Request,
  RequestAction,
  RequestLog,
  Settings,
  Shift,
  Site,
  Survey,
  SurveyResponse,
  Task,
  TaskUpdate,
} from "./types";

/**
 * عطب قراءةٍ أو كتابة: يُبلَّغ سجلّ النظام ثم يُرفع.
 * فالحذف الذي يُرفض لا يمضي بصمت وإن نسي المنادي مَسكه.
 */
function fail(message: string) {
  reportWrite("jam", message);
  return new Error(message);
}

/** قارئ عام: كل الجداول تُقرأ بنفس الشكل، فلا داعي لتكرار الدالة */
async function all<T>(table: string, order = "created_at", asc = false): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(order, { ascending: asc });
  if (error) throw fail(error.message);
  return (data ?? []) as T[];
}

export const fetchDepartments = () => all<Department>("jam_departments", "sort_order", true);
export const fetchMembers = () => all<Member>("jam_members", "name", true);
export const fetchShifts = () => all<Shift>("jam_shifts", "name", true);
export const fetchSites = () => all<Site>("jam_sites", "name", true);
export const fetchTasks = () => all<Task>("jam_tasks");
export const fetchMeetings = () => all<Meeting>("jam_meetings", "held_at");
export const fetchChains = () => all<Chain>("jam_chains", "name", true);
export const fetchRequests = () => all<Request>("jam_requests");
export const fetchPrograms = () => all<Program>("jam_programs");
export const fetchBeneficiaries = () => all<Beneficiary>("jam_beneficiaries");
export const fetchAids = () => all<Aid>("jam_aids");
export const fetchDonors = () => all<Donor>("jam_donors", "name", true);
export const fetchGrants = () => all<Grant>("jam_grants");
export const fetchLedger = () => all<LedgerEntry>("jam_ledger", "entry_date");
export const fetchPolicies = () => all<Policy>("jam_policies", "title", true);
export const fetchDocs = () => all<Doc>("jam_documents");
export const fetchAchievements = () => all<Achievement>("jam_achievements", "happened_on");
export const fetchNews = () => all<NewsItem>("jam_news", "published_at");
export const fetchMail = () => all<Mail>("jam_mail", "sent_at");
export const fetchMailReads = () => all<MailRead>("jam_mail_reads", "read_at");

/**
 * تسجيل قراءة مخاطبة. المفتاح مركّب من المخاطبة والعضو،
 * فـ upsert يكتب مرّة ولا يكرّر، ولا يُحدّث وقت القراءة الأوّل.
 */
export async function markMailRead(mailId: string, memberId: string) {
  const { error } = await supabase
    .from("jam_mail_reads")
    .upsert({ mail_id: mailId, member_id: memberId }, {
      onConflict: "mail_id,member_id",
      ignoreDuplicates: true,
    });
  if (error) throw fail(error.message);
}

export const fetchSurveys = () => all<Survey>("jam_surveys");

export async function fetchResponses(surveyId: string) {
  const { data, error } = await supabase
    .from("jam_survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("created_at");
  if (error) throw fail(error.message);
  return (data ?? []) as SurveyResponse[];
}

export const fetchLeaves = () => all<Leave>("jam_leaves", "start_date");

export async function fetchSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from("jam_settings").select("*").maybeSingle();
  if (error) throw fail(error.message);
  return (data as Settings) ?? null;
}

export async function saveSettings(patch: Partial<Settings>) {
  const { error } = await supabase.from("jam_settings").update(patch).eq("id", true);
  if (error) throw fail(error.message);
}

/** حضور يوم بعينه لكل الموظفين */
export async function fetchAttendance(day: string): Promise<Attendance[]> {
  const { data, error } = await supabase.from("jam_attendance").select("*").eq("work_date", day);
  if (error) throw fail(error.message);
  return (data ?? []) as Attendance[];
}

export async function fetchMemberAttendance(memberId: string, from: string) {
  const { data, error } = await supabase
    .from("jam_attendance")
    .select("*")
    .eq("member_id", memberId)
    .gte("work_date", from)
    .order("work_date", { ascending: false });
  if (error) throw fail(error.message);
  return (data ?? []) as Attendance[];
}

export async function fetchTaskUpdates(taskId: string) {
  const { data, error } = await supabase
    .from("jam_task_updates")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  if (error) throw fail(error.message);
  return (data ?? []) as TaskUpdate[];
}

export async function fetchChainSteps(chainId: string) {
  const { data, error } = await supabase
    .from("jam_chain_steps")
    .select("*")
    .eq("chain_id", chainId)
    .order("step_order");
  if (error) throw fail(error.message);
  return (data ?? []) as ChainStep[];
}

export async function fetchRequestLogs(requestId: string) {
  const { data, error } = await supabase
    .from("jam_request_logs")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at");
  if (error) throw fail(error.message);
  return (data ?? []) as RequestLog[];
}

export async function logRequest(
  requestId: string,
  action: RequestAction,
  stepOrder: number,
  actorId: string | null,
  note?: string,
) {
  await supabase.from("jam_request_logs").insert({
    request_id: requestId,
    action,
    step_order: stepOrder,
    actor_id: actorId,
    note: note ?? null,
  });
}

/* ===================== كتابة عامة ===================== */

export async function save(table: string, row: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).upsert(row).select().single();
  if (error) throw fail(error.message);
  return data;
}

export async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw fail(error.message);
}

export async function patch(table: string, id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(values).eq("id", id);
  if (error) throw fail(error.message);
}
