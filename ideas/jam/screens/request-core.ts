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
  const next = steps.find((s) => s.step_order === request.current_step + 1);
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
export const onResubmit = (steps: ChainStep[]): Partial<Request> => ({
  status: "pending",
  current_step: steps[0]?.step_order ?? 1,
  current_reviewer: steps[0]?.approver_id ?? null,
  review_note: null,
});

export const isMine = (r: Request, me: string | null) => Boolean(me) && r.created_by === me;
export const awaitsMe = (r: Request, me: string | null) =>
  Boolean(me) && r.status === "pending" && r.current_reviewer === me;
