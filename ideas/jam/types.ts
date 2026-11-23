/* ===================== أنواع نظام الجمعية ===================== */

export type Department = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export type MemberRole = "admin" | "manager" | "member";

export type Member = {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  job_title: string | null;
  department_id: string | null;
  manager_id: string | null;
  role: MemberRole;
  avatar_url: string | null;
  hired_at: string | null;
  annual_leave_days: number;
  remote_allowed: boolean;
  shift_id: string | null;
  is_active: boolean;
};

export type Shift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  late_after_minutes: number;
  early_leave_before_minutes: number;
  work_days: number[];
  is_default: boolean;
};

export type Site = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  is_active: boolean;
};

export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "leave"
  | "holiday"
  | "remote";

export type Attendance = {
  id: string;
  member_id: string;
  site_id: string | null;
  work_date: string;
  check_in_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_in_distance_m: number | null;
  check_out_at: string | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_out_distance_m: number | null;
  status: AttendanceStatus;
  is_remote: boolean;
  note: string | null;
};

export type LeaveType = "annual" | "sick" | "unpaid" | "emergency" | "mission";

export type Leave = {
  id: string;
  member_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  note: string | null;
  approved: boolean;
};

export type TaskStatus = "todo" | "doing" | "done" | "blocked";

export type Task = {
  id: string;
  title: string;
  body: string | null;
  assignee_id: string | null;
  creator_id: string | null;
  department_id: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  done_at: string | null;
  done_note: string | null;
  proof_url: string | null;
  attachments: { url: string; name: string }[];
  recurrence: string | null;
  parent_id: string | null;
  meeting_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskUpdate = {
  id: number;
  task_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
};

export type Meeting = {
  id: string;
  title: string;
  held_at: string;
  number: number | null;
  location: string | null;
  department_id: string | null;
  attendees: string[];
  guests: string | null;
  agenda: string | null;
  notes: string | null;
  decisions: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
};

/* ===================== الطلبات والاعتماد ===================== */

export type RequestStatus =
  | "draft"
  | "pending"
  | "returned"
  | "approved"
  | "rejected"
  | "delegated";

export type RequestAction =
  | "submitted"
  | "forwarded"
  | "approved"
  | "rejected"
  | "returned"
  | "delegated"
  | "resubmitted";

export type Chain = {
  id: string;
  name: string;
  purpose: string;
  is_active: boolean;
};

export type ChainStep = {
  id: string;
  chain_id: string;
  step_order: number;
  approver_id: string;
  label: string | null;
};

export type Request = {
  id: string;
  number: number;
  title: string;
  kind: string;
  body: string | null;
  amount: number | null;
  attachments: { url: string; name: string }[];
  priority: number;
  status: RequestStatus;
  created_by: string | null;
  chain_id: string | null;
  current_step: number;
  current_reviewer: string | null;
  delegated_to: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestLog = {
  id: number;
  request_id: string;
  step_order: number;
  actor_id: string | null;
  action: RequestAction;
  note: string | null;
  created_at: string;
};

/* ===================== البرامج والمستفيدون ===================== */

export type ProgramStatus = "planned" | "running" | "paused" | "done" | "cancelled";

export type Program = {
  id: string;
  name: string;
  summary: string | null;
  department_id: string | null;
  owner_id: string | null;
  status: ProgramStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  target_beneficiaries: number;
  cover_url: string | null;
};

export type Beneficiary = {
  id: string;
  name: string;
  national_id: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  family_size: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  category: string | null;
  income: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type AidStatus = "requested" | "approved" | "disbursed" | "rejected";

export type Aid = {
  id: string;
  beneficiary_id: string;
  program_id: string | null;
  kind: string;
  amount: number;
  description: string | null;
  status: AidStatus;
  requested_by: string | null;
  approved_by: string | null;
  disbursed_at: string | null;
  created_at: string;
};

/* ===================== الموارد والمالية ===================== */

export type Donor = {
  id: string;
  name: string;
  kind: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  url: string | null;
  notes: string | null;
};

export type GrantStatus =
  | "idea"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "closed";

export type Grant = {
  id: string;
  donor_id: string | null;
  program_id: string | null;
  title: string;
  requested: number;
  approved_amount: number | null;
  collected: number;
  status: GrantStatus;
  submitted_at: string | null;
  closes_at: string | null;
  owner_id: string | null;
  notes: string | null;
};

export type EntryKind = "income" | "expense";

export type LedgerEntry = {
  id: string;
  kind: EntryKind;
  amount: number;
  category: string;
  description: string | null;
  entry_date: string;
  program_id: string | null;
  grant_id: string | null;
  request_id: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
};

/* ===================== الحوكمة والمحتوى ===================== */

export type Policy = {
  id: string;
  title: string;
  category: string;
  body: string | null;
  file_url: string | null;
  version: string | null;
  approved_at: string | null;
  review_due: string | null;
  owner_id: string | null;
};

export type Doc = {
  id: string;
  title: string;
  category: string;
  file_url: string;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  title: string;
  member_id: string | null;
  program_id: string | null;
  happened_on: string;
  proof_url: string | null;
};

export type NewsItem = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  cover_url: string | null;
  published: boolean;
  published_at: string;
};

export type Mail = {
  id: string;
  number: number;
  subject: string;
  body: string | null;
  kind: string;
  from_id: string | null;
  to_ids: string[];
  cc_ids: string[];
  external_party: string | null;
  attachments: { url: string; name: string }[];
  sent_at: string;
};

export type QuestionKind = "text" | "long" | "choice" | "multi" | "scale" | "yesno";

export type Question = {
  /** معرّف ثابت داخل الاستبيان — مفتاح الإجابة */
  id: string;
  kind: QuestionKind;
  label: string;
  required: boolean;
  /** للاختيار والمتعدّد */
  options?: string[];
};

export type Survey = {
  id: string;
  title: string;
  intro: string | null;
  is_open: boolean;
  questions: Question[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SurveyResponse = {
  id: string;
  survey_id: string;
  /** مفتاحها معرّف السؤال */
  answers: Record<string, string | string[] | number | boolean | null>;
  member_id: string | null;
  respondent: string | null;
  created_at: string;
};

export type MailRead = {
  mail_id: string;
  member_id: string;
  read_at: string;
};

export type Settings = {
  name: string;
  logo_url: string | null;
  license_no: string | null;
  founded_on: string | null;
  vision: string | null;
  mission: string | null;
  values_text: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  fiscal_start: number;
};

/* ===================== مسمّيات عربية ===================== */

export const TASK_STATUS: Record<TaskStatus, string> = {
  todo: "لم تبدأ",
  doing: "جارية",
  done: "مكتملة",
  blocked: "متعثّرة",
};

export const REQUEST_STATUS: Record<RequestStatus, string> = {
  draft: "مسوّدة",
  pending: "قيد المراجعة",
  returned: "مُرجَعة",
  approved: "معتمدة",
  rejected: "مرفوضة",
  delegated: "محوّلة للتنفيذ",
};

export const PROGRAM_STATUS: Record<ProgramStatus, string> = {
  planned: "مخطّط له",
  running: "جارٍ",
  paused: "متوقّف",
  done: "منتهٍ",
  cancelled: "ملغى",
};

export const AID_STATUS: Record<AidStatus, string> = {
  requested: "مطلوبة",
  approved: "معتمدة",
  disbursed: "مصروفة",
  rejected: "مرفوضة",
};

export const GRANT_STATUS: Record<GrantStatus, string> = {
  idea: "فكرة",
  submitted: "قُدّمت",
  under_review: "قيد الدراسة",
  approved: "معتمدة",
  rejected: "مرفوضة",
  closed: "مغلقة",
};

export const LEAVE_TYPE: Record<LeaveType, string> = {
  annual: "سنوية",
  sick: "مرضية",
  unpaid: "بلا راتب",
  emergency: "اضطرارية",
  mission: "مهمّة عمل",
};

export const QUESTION_KIND: Record<QuestionKind, string> = {
  text: "سطر",
  long: "نصّ",
  choice: "اختيار واحد",
  multi: "اختيار متعدّد",
  scale: "مقياس ١–٥",
  yesno: "نعم / لا",
};

export const ATTENDANCE_STATUS: Record<AttendanceStatus, string> = {
  present: "حاضر",
  late: "متأخّر",
  absent: "غائب",
  leave: "إجازة",
  holiday: "عطلة",
  remote: "عن بُعد",
};

export const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "مدير النظام",
  manager: "مدير إدارة",
  member: "موظف",
};
