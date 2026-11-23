import type { ChainStep, Request, RequestStatus } from "../types";

export const STATUS_TONE: Record<RequestStatus, string> = {
  draft: "var(--j-faint)",
  pending: "var(--j-warn)",
  returned: "var(--j-accent)",
  approved: "var(--j-ok)",
  rejected: "var(--j-danger)",
  delegated: "var(--j-info)",
};

export const PRIORITY = [
  { v: 1, label: "عاجل", tone: "var(--j-danger)" },
  { v: 2, label: "متوسط", tone: "var(--j-warn)" },
  { v: 3, label: "منخفض", tone: "var(--j-faint)" },
];

export const KINDS = [
  { v: "general", label: "عام" },
  { v: "purchase", label: "شراء" },
  { v: "finance", label: "صرف مالي" },
  { v: "hr", label: "شؤون موظفين" },
  { v: "leave", label: "إجازة" },
];

/**
 * ما يحدث عند اعتماد خطوة.
 * إن بقيت خطوة بعدها انتقل الطلب إليها، وإلا اعتُمد نهائيًا.
 * حساب هذا في مكان واحد يمنع تضارب الواجهة مع ما في القاعدة.
 */
export function afterApprove(
  request: Request,
  steps: ChainStep[],
): Partial<Request> {
  /**
   * التالية هي أدنى خطوةٍ أعلى من الحالية، لا «الحالية زائد واحد».
   * فأرقام الخطوات لا يلزم أن تتلاحق: حذف خطوة وسطى يجعلها ١ و٣،
   * فالبحث عن ٢ لا يجد شيئًا ويُعتمد الطلب نهائيًا وتُتخطّى الخطوتان
   * الباقيتان بصمت.
   */
  const next = steps
    .filter((s) => s.step_order > request.current_step)
    .sort((a, b) => a.step_order - b.step_order)[0];
  if (next) {
    return {
      current_step: next.step_order,
      current_reviewer: next.approver_id,
      status: "pending",
    };
  }
  return {
    status: "approved",
    current_reviewer: null,
    reviewed_at: new Date().toISOString(),
  };
}

/** الإرجاع يعيد الطلب لصاحبه ويصفّر المسار */
export const afterReturn = (note: string): Partial<Request> => ({
  status: "returned",
  current_step: 1,
  current_reviewer: null,
  review_note: note || null,
  reviewed_at: new Date().toISOString(),
});

export const afterReject = (note: string): Partial<Request> => ({
  status: "rejected",
  current_reviewer: null,
  review_note: note || null,
  reviewed_at: new Date().toISOString(),
});

/** إعادة الإرسال بعد الإرجاع تبدأ من أول السلسلة */
export const onResubmit = (steps: ChainStep[]): Partial<Request> => {
  /** الأولى بالترتيب، لا أوّل ما جاء في المصفوفة */
  const first = [...steps].sort((a, b) => a.step_order - b.step_order)[0];
  return {
    status: "pending",
    current_step: first?.step_order ?? 1,
    current_reviewer: first?.approver_id ?? null,
    review_note: null,
  };
};

/**
 * تحويل المراجعة إلى عضو آخر دون بتٍّ في الطلب.
 * المعتمِد الذي ليس أهلًا للحكم في مسألةٍ يحوّلها، والخطوة لا تتغيّر
 * فالسلسلة تبقى على ترتيبها.
 */
export const afterForward = (to: string, note: string): Partial<Request> => ({
  status: "pending",
  current_reviewer: to,
  review_note: note || null,
});

/**
 * الإحالة للتنفيذ بعد الاعتماد.
 * الاعتماد قرارٌ، والتنفيذ عمل؛ والطلب المعتمد يُحال إلى من ينفّذه
 * فيظهر في وارده حتى يُقفله.
 */
export const afterDelegate = (to: string, note: string): Partial<Request> => ({
  status: "delegated",
  delegated_to: to,
  review_note: note || null,
});

/** إقفال المحال بعد تنفيذه */
export const afterExecuted = (note: string): Partial<Request> => ({
  status: "approved",
  delegated_to: null,
  review_note: note || null,
  reviewed_at: new Date().toISOString(),
});

export const isMine = (r: Request, me: string | null) => Boolean(me) && r.created_by === me;
/**
 * ما ينتظرني: مراجعةٌ عليّ، أو تنفيذٌ أُحيل إليّ.
 * كان المحال إليه لا يرى شيئًا في وارده، فالإحالة كلمةٌ بلا أثر.
 */
export const awaitsMe = (r: Request, me: string | null) =>
  Boolean(me) &&
  ((r.status === "pending" && r.current_reviewer === me) ||
    (r.status === "delegated" && r.delegated_to === me));
