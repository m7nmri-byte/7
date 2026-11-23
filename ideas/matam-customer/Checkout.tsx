"use client";

import { useState } from "react";
import type { OrderType, Settings, Zone } from "../matam/types";
import { useCart } from "../matam/cart";
import { createOrder } from "../matam/db";
import { enqueue, type PendingOrder } from "../matam/queue";
import { money } from "../matam/format";
import { MSheet, mField, mPrimary } from "../matam/ui";

const PROFILE_KEY = "matam.profile";

type Profile = { name: string; phone: string; address: string };

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {
    /* لا بأس */
  }
  return { name: "", phone: "", address: "" };
}

/** نموذج إتمام الطلب — يتذكّر بيانات صاحب الجهاز فلا يكتبها كل مرة */
export function Checkout({
  open,
  deviceId,
  settings,
  zones,
  onClose,
  onPlaced,
  onQueued,
}: {
  open: boolean;
  deviceId: string;
  settings: Settings | null;
  zones: Zone[];
  onClose: () => void;
  onPlaced: (orderId: string) => void;
  onQueued: () => void;
}) {
  const { lines, subtotal, clear } = useCart();
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [type, setType] = useState<OrderType>("delivery");
  const [zoneId, setZoneId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const deliveryOn = settings?.delivery_enabled !== false;
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const fee =
    type === "pickup" ? 0 : zone ? Number(zone.fee) : Number(settings?.delivery_fee ?? 0);
  const total = subtotal + fee;

  const set = (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch }));

  const submit = async () => {
    setError(null);
    if (!profile.name.trim() || !profile.phone.trim()) {
      setError("الاسم ورقم الجوال مطلوبان");
      return;
    }
    if (type === "delivery" && !profile.address.trim()) {
      setError("اكتب عنوان التوصيل");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* لا بأس */
    }

    const payload: PendingOrder = {
      customer_name: profile.name.trim(),
      customer_phone: profile.phone.trim(),
      device_id: deviceId,
      items: lines.map((l) => ({
        item_id: l.item_id,
        name: l.name,
        price: l.unit_price,
        quantity: l.quantity,
        image_url: l.image_url,
        options: l.options,
        note: l.note,
      })),
      subtotal,
      delivery_fee: fee,
      total,
      status: "pending",
      order_type: type,
      payment_status: "pending",
      notes: notes.trim() || null,
      kitchen_notes: null,
      estimated_minutes: null,
      estimated_set_at: null,
      delivery_address: type === "delivery" ? profile.address.trim() : null,
      delivery_lat: null,
      delivery_lng: null,
      zone_id: type === "delivery" ? (zoneId || null) : null,
      zone_name: type === "delivery" ? (zone?.name ?? null) : null,
      driver_id: null,
      driver_name: null,
    };

    try {
      const order = await createOrder(payload);
      clear();
      onPlaced(order.id);
      onClose();
    } catch {
      // الشبكة أو الخادم تعذّر — يُحفظ الطلب ويُرسَل تلقائيًا عند عودتها
      enqueue(payload);
      clear();
      onQueued();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <MSheet
      open
      onClose={onClose}
      title="إتمام الطلب"
      footer={
      <button onClick={submit} disabled={busy} className={`${mPrimary} w-full`}>
        {busy ? "جارٍ الإرسال…" : `أرسل الطلب · ${money(total)}`}
      </button>
      }
    >
      <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-xl border border-m-line p-1">
        {(
          [
            ["delivery", "توصيل"],
            ["pickup", "استلام من المطعم"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setType(k)}
            disabled={k === "delivery" && !deliveryOn}
            className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors disabled:opacity-40 ${
              type === k ? "bg-m-accent font-semibold text-[#ffffff]" : "text-m-dim"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-m-dim">الاسم</span>
        <input
          className={mField}
          value={profile.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="اسمك"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-m-dim">رقم الجوال</span>
        <input
          className={`${mField} mark`}
          inputMode="tel"
          dir="ltr"
          value={profile.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="05xxxxxxxx"
        />
      </label>

      {type === "delivery" && (
        <>
          {zones.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-m-dim">منطقة التوصيل</span>
              <select
                className={mField}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                <option value="">— اختر المنطقة —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} · {money(Number(z.fee))}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-m-dim">العنوان</span>
            <textarea
              className={`${mField} min-h-20 resize-none`}
              value={profile.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="الحي، الشارع، وصف يسهّل الوصول"
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-m-dim">ملاحظات</span>
        <input
          className={mField}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="اختياري"
        />
      </label>

      <dl className="flex flex-col gap-2 rounded-xl bg-m-raised p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-m-dim">المجموع</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-m-dim">التوصيل</dt>
          <dd>{fee > 0 ? money(fee) : "—"}</dd>
        </div>
        <div className="flex justify-between border-t border-m-line pt-2 font-semibold">
          <dt>الإجمالي</dt>
          <dd className="text-m-accent">{money(total)}</dd>
        </div>
        <p className="text-[11px] text-m-faint">الدفع نقدًا عند الاستلام</p>
      </dl>

      {error && (
        <p className="rounded-lg bg-m-danger/15 px-3 py-2 text-xs text-m-danger">{error}</p>
      )}
      </div>
    </MSheet>
  );
}
