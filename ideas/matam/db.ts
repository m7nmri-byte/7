import { supabase } from "@/lib/supabase";
import { reportWrite } from "@/lib/failures";
import type {
  Banner,
  Category,
  Combo,
  Driver,
  Item,
  Order,
  OrderStatus,
  PopupAd,
  Settings,
  Ticket,
  TicketMessage,
  Zone,
} from "./types";

/**
 * عطب كتابةٍ أو قراءة: يُبلَّغ السجلّ ثم يُرفع.
 * فحتى لو نسي المنادي مَسكه، رآه المستخدم في شريط النظام.
 */
function fail(message: string) {
  reportWrite("matam", message);
  return new Error(message);
}

/* ===================== القائمة ===================== */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("matam_categories")
    .select("*")
    .order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as Category[];
}

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase.from("matam_items").select("*").order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as Item[];
}

export async function fetchCombos(): Promise<Combo[]> {
  const { data, error } = await supabase.from("matam_combos").select("*").order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as Combo[];
}

/* ===================== الإعدادات والمحتوى ===================== */

export async function fetchSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from("matam_settings").select("*").maybeSingle();
  if (error) throw fail(error.message);
  return (data as Settings) ?? null;
}

export async function saveSettings(patch: Partial<Settings>) {
  const { error } = await supabase.from("matam_settings").update(patch).eq("id", true);
  if (error) throw fail(error.message);
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from("matam_banners").select("*").order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as Banner[];
}

export async function fetchAds(): Promise<PopupAd[]> {
  const { data, error } = await supabase.from("matam_popup_ads").select("*").order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as PopupAd[];
}

/* ===================== التوصيل ===================== */

export async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from("matam_zones").select("*").order("sort_order");
  if (error) throw fail(error.message);
  return (data ?? []) as Zone[];
}

export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from("matam_drivers").select("*").order("name");
  if (error) throw fail(error.message);
  return (data ?? []) as Driver[];
}

/* ===================== الطلبات ===================== */

type OrderQuery = {
  statuses?: OrderStatus[];
  deviceId?: string;
  driverId?: string;
  limit?: number;
  /** الصفحة: يُجلب ما بعد هذا العدد */
  offset?: number;
  since?: string;
  /** حدٌّ أعلى للزمن — يلزم تقرير يومٍ بعينه لا «منذ كذا» */
  until?: string;
};

export const PAGE_SIZE = 50;

/**
 * الطلبات مرتّبة بالأحدث.
 * الحدّ الافتراضي صفحة واحدة لا كل السجلّ — جلب ألف طلب في كل
 * تحديث لحظي يُبطئ الجهاز ويستهلك الحصّة بلا فائدة.
 */
export async function fetchOrders(q: OrderQuery = {}): Promise<Order[]> {
  const limit = q.limit ?? PAGE_SIZE;
  const from = q.offset ?? 0;

  let query = supabase
    .from("matam_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (q.statuses?.length) query = query.in("status", q.statuses);
  if (q.deviceId) query = query.eq("device_id", q.deviceId);
  if (q.driverId) query = query.eq("driver_id", q.driverId);
  if (q.since) query = query.gte("created_at", q.since);
  if (q.until) query = query.lte("created_at", q.until);

  const { data, error } = await query;
  if (error) throw fail(error.message);
  return (data ?? []) as Order[];
}

/** عدد الطلبات المطابقة — للترقيم وللتقارير */
export async function countOrders(q: Pick<OrderQuery, "statuses" | "since"> = {}) {
  let query = supabase.from("matam_orders").select("id", { count: "exact", head: true });
  if (q.statuses?.length) query = query.in("status", q.statuses);
  if (q.since) query = query.gte("created_at", q.since);
  const { count } = await query;
  return count ?? 0;
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from("matam_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw fail(error.message);
  return (data as Order) ?? null;
}

export async function createOrder(
  order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">,
  /**
   * الإرسال الصامت لإعادة المحاولة من الطابور: تفشل في الخلف كل
   * نصف دقيقة، فلو بلّغت السجلّ لأغرقت شاشة العميل بشرائط خطأ.
   */
  opts: { quiet?: boolean } = {},
) {
  const { data, error } = await supabase
    .from("matam_orders")
    .insert(order)
    .select()
    .single();
  if (error) throw opts.quiet ? new Error(error.message) : fail(error.message);
  return data as Order;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const { error } = await supabase.from("matam_orders").update(patch).eq("id", id);
  if (error) throw fail(error.message);
}

/** سجلّ انتقالات الحالة — تُملأ بزنادٍ في قاعدة البيانات */
export async function fetchOrderEvents(orderId: string) {
  const { data, error } = await supabase
    .from("matam_order_events")
    .select("status, created_at")
    .eq("order_id", orderId)
    .order("created_at");
  if (error) throw fail(error.message);
  return (data ?? []) as { status: OrderStatus; created_at: string }[];
}

/* ===================== الدعم ===================== */

export async function fetchTickets(deviceId?: string): Promise<Ticket[]> {
  let q = supabase
    .from("matam_tickets")
    .select("*")
    .order("updated_at", { ascending: false });
  if (deviceId) q = q.eq("device_id", deviceId);
  const { data, error } = await q;
  if (error) throw fail(error.message);
  return (data ?? []) as Ticket[];
}

export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from("matam_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw fail(error.message);
  return (data ?? []) as TicketMessage[];
}

export async function sendTicketMessage(
  ticketId: string,
  msg: Pick<TicketMessage, "sender_role" | "sender_name" | "text">,
) {
  await supabase.from("matam_ticket_messages").insert({ ticket_id: ticketId, ...msg });
  await supabase.from("matam_tickets").update({ status: "open" }).eq("id", ticketId);
}

/* ===================== أدوات عامة ===================== */

export const rows = <T>(table: string) => supabase.from(table) as unknown as T;

/** حذف صفّ بمعرّفه من أي جدول في النظام */
export async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw fail(error.message);
}

/** إنشاء أو تحديث حسب وجود المعرّف */
export async function upsert<T extends { id?: string }>(table: string, row: T) {
  const { data, error } = await supabase.from(table).upsert(row).select().single();
  if (error) throw fail(error.message);
  return data;
}

/* ===================== سجلّ العملاء ===================== */

/**
 * هل هذا الرقم محظور؟
 *
 * الحظر شأن إدارة، فلا يُعطَّل الطلب لأجله: كل عطبٍ هنا يُفهم
 * «غير محظور» بصمت ولا يُبلَّغ سجلّ الأعطال — فالعميل لا شأن له
 * بصلاحية جدولٍ لا يراه.
 */
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const clean = phone.trim();
  if (!clean) return false;
  try {
    const { data, error } = await supabase
      .from("matam_users")
      .select("is_blocked")
      .eq("phone", clean)
      .maybeSingle();
    if (error) return false;
    return Boolean((data as { is_blocked?: boolean } | null)?.is_blocked);
  } catch {
    return false;
  }
}

/**
 * يحفظ العميل في سجلّ العملاء عند أول طلب ويحدّثه بعده.
 *
 * قبله كان السجلّ يُملأ يدويًا من الإدارة وحدها، وأعمدة العنوان
 * المحفوظ فارغة أبدًا. وهو كذلك بأفضل جهد: فشلُه لا يُفشل الطلب.
 */
export async function rememberCustomer(row: {
  phone: string;
  name: string;
  device_id: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}): Promise<void> {
  const phone = row.phone.trim();
  if (!phone) return;
  try {
    await supabase.from("matam_users").upsert(
      {
        phone,
        name: row.name.trim(),
        device_id: row.device_id,
        saved_address: row.address,
        saved_lat: row.lat,
        saved_lng: row.lng,
      },
      { onConflict: "phone" },
    );
  } catch {
    /* السجلّ تحسينٌ للإدارة، لا شرطٌ لنجاح الطلب */
  }
}
