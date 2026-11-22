import { supabase } from "@/lib/supabase";
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

/* ===================== القائمة ===================== */

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("matam_categories")
    .select("*")
    .order("sort_order");
  return (data ?? []) as Category[];
}

export async function fetchItems(): Promise<Item[]> {
  const { data } = await supabase.from("matam_items").select("*").order("sort_order");
  return (data ?? []) as Item[];
}

export async function fetchCombos(): Promise<Combo[]> {
  const { data } = await supabase.from("matam_combos").select("*").order("sort_order");
  return (data ?? []) as Combo[];
}

/* ===================== الإعدادات والمحتوى ===================== */

export async function fetchSettings(): Promise<Settings | null> {
  const { data } = await supabase.from("matam_settings").select("*").maybeSingle();
  return (data as Settings) ?? null;
}

export async function saveSettings(patch: Partial<Settings>) {
  return supabase.from("matam_settings").update(patch).eq("id", true);
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase.from("matam_banners").select("*").order("sort_order");
  return (data ?? []) as Banner[];
}

export async function fetchAds(): Promise<PopupAd[]> {
  const { data } = await supabase.from("matam_popup_ads").select("*").order("sort_order");
  return (data ?? []) as PopupAd[];
}

/* ===================== التوصيل ===================== */

export async function fetchZones(): Promise<Zone[]> {
  const { data } = await supabase.from("matam_zones").select("*").order("sort_order");
  return (data ?? []) as Zone[];
}

export async function fetchDrivers(): Promise<Driver[]> {
  const { data } = await supabase.from("matam_drivers").select("*").order("name");
  return (data ?? []) as Driver[];
}

/* ===================== الطلبات ===================== */

type OrderQuery = {
  statuses?: OrderStatus[];
  deviceId?: string;
  driverId?: string;
  limit?: number;
  since?: string;
};

export async function fetchOrders(q: OrderQuery = {}): Promise<Order[]> {
  let query = supabase
    .from("matam_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(q.limit ?? 200);

  if (q.statuses?.length) query = query.in("status", q.statuses);
  if (q.deviceId) query = query.eq("device_id", q.deviceId);
  if (q.driverId) query = query.eq("driver_id", q.driverId);
  if (q.since) query = query.gte("created_at", q.since);

  const { data } = await query;
  return (data ?? []) as Order[];
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const { data } = await supabase.from("matam_orders").select("*").eq("id", id).maybeSingle();
  return (data as Order) ?? null;
}

export async function createOrder(
  order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("matam_orders")
    .insert(order)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Order;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const { error } = await supabase.from("matam_orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** سجلّ انتقالات الحالة — تُملأ بزنادٍ في قاعدة البيانات */
export async function fetchOrderEvents(orderId: string) {
  const { data } = await supabase
    .from("matam_order_events")
    .select("status, created_at")
    .eq("order_id", orderId)
    .order("created_at");
  return (data ?? []) as { status: OrderStatus; created_at: string }[];
}

/* ===================== الدعم ===================== */

export async function fetchTickets(deviceId?: string): Promise<Ticket[]> {
  let q = supabase
    .from("matam_tickets")
    .select("*")
    .order("updated_at", { ascending: false });
  if (deviceId) q = q.eq("device_id", deviceId);
  const { data } = await q;
  return (data ?? []) as Ticket[];
}

export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data } = await supabase
    .from("matam_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");
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
  if (error) throw new Error(error.message);
}

/** إنشاء أو تحديث حسب وجود المعرّف */
export async function upsert<T extends { id?: string }>(table: string, row: T) {
  const { data, error } = await supabase.from(table).upsert(row).select().single();
  if (error) throw new Error(error.message);
  return data;
}
