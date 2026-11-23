import type { OrderStatus, OrderType, PaymentStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "بانتظار القبول",
  confirmed: "مقبول",
  preparing: "قيد التحضير",
  ready: "جاهز",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "var(--m-warn)",
  confirmed: "var(--m-info)",
  preparing: "var(--m-accent)",
  ready: "var(--m-ok)",
  out_for_delivery: "var(--m-info)",
  delivered: "var(--m-ok)",
  cancelled: "var(--m-danger)",
};

/** مسار الطلب الطبيعي — يُستعمل لشريط التقدّم ولزرّ «الخطوة التالية» */
export const FLOW_DELIVERY: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export const FLOW_PICKUP: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

export const flowFor = (type: OrderType) =>
  type === "pickup" ? FLOW_PICKUP : FLOW_DELIVERY;

export function nextStatus(
  status: OrderStatus,
  type: OrderType,
): OrderStatus | null {
  const flow = flowFor(type);
  const i = flow.indexOf(status);
  if (i === -1 || i === flow.length - 1) return null;
  return flow[i + 1];
}

/** نصّ الزرّ الذي ينقل الطلب إلى حالته التالية */
const ADVANCE: Partial<Record<OrderStatus, string>> = {
  pending: "اقبل الطلب",
  confirmed: "ابدأ التحضير",
  preparing: "جاهز",
  ready: "أخرجه للتوصيل",
  out_for_delivery: "تم التسليم",
};

/**
 * النصّ يتبع نوع الطلب لا الحالة وحدها.
 *
 * طلب الاستلام الجاهز ينتقل إلى «تم التسليم» لا إلى الطريق، وكان
 * زرّه يقول «أخرجه للتوصيل» — فيفعل الصواب ويقول الخطأ، وهو مما
 * يُوقع في الغلط في مطبخ مشغول.
 */
export function advanceLabel(status: OrderStatus, type: OrderType): string | undefined {
  if (status === "ready" && type === "pickup") return "سلّمه للزبون";
  return ADVANCE[status];
}

export const isOpenOrder = (s: OrderStatus) =>
  s !== "delivered" && s !== "cancelled";

/** الطلبات التي تهمّ المطبخ */
export const isKitchenOrder = (s: OrderStatus) =>
  s === "pending" || s === "confirmed" || s === "preparing" || s === "ready";

export const TYPE_LABEL: Record<OrderType, string> = {
  delivery: "توصيل",
  pickup: "استلام من المطعم",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "بانتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مُسترجَع",
};
