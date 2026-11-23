/* ===================== أنواع نظام المطعم ===================== */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type OrderType = "delivery" | "pickup";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

/** خيار واحد داخل مجموعة: حجم، إضافة، صلصة… */
export type ItemOption = {
  id: string;
  name: string;
  price: number;
  available: boolean;
};

/** خيار مختار مع كمّيته — «جبن ×٢» يختلف سعره وتحضيره عن «جبن» */
export type ChosenOne = { name: string; qty: number };

/** single = اختيار واحد، multi = عدة اختيارات */
export type OptionGroup = {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  options: ItemOption[];
  /** يسمح بتكرار الخيار الواحد بكمّية */
  allow_quantity?: boolean;
  /** يظهر للمطبخ بارزًا — خيارات تغيّر طريقة التحضير لا السعر فقط */
  kitchen_control?: boolean;
};

export type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  tags: string[];
  discount_percent: number | null;
  is_best_seller: boolean;
  is_new: boolean;
  calories: number | null;
  allergens: string[];
  suggested_ids: string[];
  exclude_base_price: boolean;
  option_groups: OptionGroup[];
};

export type ComboRef = { item_id: string; qty: number };

export type Combo = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  items: ComboRef[];
  option_item_ids: string[];
};

export type Zone = {
  id: string;
  name: string;
  max_distance_km: number;
  fee: number;
  sort_order: number;
};

export type Driver = {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
};

/** الخيارات المختارة على صنف داخل الطلب — تُحفظ بالاسم ليبقى السجل مقروءًا
    حتى لو حُذف الخيار من القائمة لاحقًا */
export type ChosenOption = {
  group_id: string;
  group_name: string;
  names: string[];
  /** الكمّيات موازية للأسماء حين سمحت المجموعة بها */
  quantities?: number[];
  extra: number;
  /** يُبرزه المطبخ */
  kitchen?: boolean;
};

export type OrderItem = {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  options: ChosenOption[];
  note: string | null;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  device_id: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  order_type: OrderType;
  payment_status: PaymentStatus;
  notes: string | null;
  kitchen_notes: string | null;
  estimated_minutes: number | null;
  estimated_set_at: string | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  zone_id: string | null;
  zone_name: string | null;
  driver_id: string | null;
  driver_name: string | null;
  cancel_reason: string | null;
  printed_at: string | null;
  rating: number | null;
  rating_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Shift = { open: string; close: string };
export type DayHours = { day: number; closed: boolean; shifts: Shift[] };

export type Settings = {
  restaurant_name: string;
  logo_url: string | null;
  cover_url: string | null;
  is_open: boolean;
  allow_orders: boolean;
  delivery_enabled: boolean;
  delivery_fee: number;
  min_order_amount: number;
  estimated_prep_time: number;
  whatsapp_number: string | null;
  restaurant_phone: string | null;
  address: string | null;
  welcome_message: string | null;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  work_hours: DayHours[];
  currency: string;
  tax_percent: number;
  notify_sound: boolean;
};

export type Banner = {
  id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  link_type: "none" | "category" | "item";
  link_id: string | null;
};

export type PopupAd = {
  id: string;
  image_urls: string[];
  caption: string | null;
  is_active: boolean;
  sort_order: number;
  auto_scroll: boolean;
  auto_scroll_seconds: number;
  link_type: "none" | "category" | "item" | "external";
  link_id: string | null;
  external_url: string | null;
};

export type Ticket = {
  id: string;
  device_id: string | null;
  customer_name: string;
  customer_phone: string;
  category: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: number;
  ticket_id: string;
  sender_role: "customer" | "staff";
  sender_name: string;
  text: string;
  created_at: string;
};

/** سطر في سلّة الشراء قبل أن يصير طلبًا */
export type CartLine = {
  /** مفتاح يميّز نفس الصنف بخيارات مختلفة */
  key: string;
  item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  options: ChosenOption[];
  note: string | null;
};
