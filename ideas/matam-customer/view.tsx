"use client";

import { useCallback, useMemo, useState } from "react";
import type { Combo, Item, Order } from "../matam/types";
import {
  fetchAds,
  fetchBanners,
  fetchCategories,
  fetchCombos,
  fetchItems,
  fetchOrders,
  fetchSettings,
  fetchTickets,
  fetchZones,
} from "../matam/db";
import { useCart } from "../matam/cart";
import { useDeviceId, useLive, useTick } from "../matam/hooks";
import { useQueue, useQueueFlusher } from "../matam/queue";
import { isOpenOrder } from "../matam/status";
import { closedText, openState } from "../matam/hours";
import { DataErrorBar, Body, Phone, TabBar, TopBar, useMToast } from "../matam/ui";
import { Menu } from "./Menu";
import { ItemSheet } from "./ItemSheet";
import { ComboSheet } from "./ComboSheet";
import { PopupAds } from "./PopupAds";
import { Cart } from "./Cart";
import { Checkout } from "./Checkout";
import { OrderDetail, OrdersList } from "./Tracking";
import { Rating } from "./Rating";
import { Support } from "./Support";

type Tab = "menu" | "cart" | "orders" | "support";

const I = {
  menu: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5h2l2 11h10l2-8H7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M21 12a8 8 0 1 1-3.2-6.4" strokeLinecap="round" />
      <path d="M12 8v5l3 2" strokeLinecap="round" />
    </svg>
  ),
};

export default function CustomerApp() {
  const deviceId = useDeviceId();
  const [tab, setTab] = useState<Tab>("menu");
  const [item, setItem] = useState<Item | null>(null);
  const [combo, setCombo] = useState<Combo | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [openOrder, setOpenOrder] = useState<Order | null>(null);
  const { toast, node } = useMToast();
  const { count } = useCart();
  const queued = useQueue();

  const { data: settings } = useLive("matam_settings", fetchSettings);
  const { data: categories } = useLive("matam_categories", fetchCategories);
  const { data: items } = useLive("matam_items", fetchItems);
  const { data: combos } = useLive("matam_combos", fetchCombos);
  const { data: zones } = useLive("matam_zones", fetchZones);
  const { data: banners } = useLive("matam_banners", fetchBanners);
  const { data: ads } = useLive("matam_popup_ads", fetchAds);

  const loadOrders = useCallback(
    () => (deviceId ? fetchOrders({ deviceId, limit: 60 }) : Promise.resolve([])),
    [deviceId],
  );
  const { data: orders, refresh: refreshOrders } = useLive("matam_orders", loadOrders);

  const loadTickets = useCallback(
    () => (deviceId ? fetchTickets(deviceId) : Promise.resolve([])),
    [deviceId],
  );
  const { data: tickets, refresh: refreshTickets } = useLive("matam_tickets", loadTickets);

  // الطلبات المؤجّلة تُرسل حين تعود الشبكة
  const onFlushed = useCallback(
    (n: number) => {
      toast(n === 1 ? "أُرسل طلبك المؤجّل" : `أُرسلت ${n} طلبات مؤجّلة`);
      void refreshOrders();
    },
    [toast, refreshOrders],
  );
  useQueueFlusher(onFlushed);

  const orderList = useMemo(() => orders ?? [], [orders]);
  const live = orderList.filter((o) => isOpenOrder(o.status));

  // الطلب المفتوح يُقرأ من آخر نسخة حيّة، فتتحدّث حالته أمام الزبون
  const shown = openOrder ? (orderList.find((o) => o.id === openOrder.id) ?? openOrder) : null;

  const profile = (() => {
    try {
      const raw = localStorage.getItem("matam.profile");
      return raw ? (JSON.parse(raw) as { name: string; phone: string }) : { name: "", phone: "" };
    } catch {
      return { name: "", phone: "" };
    }
  })();

  const fee = Number(settings?.delivery_fee ?? 0);

  /** حالة المطعم تُعاد كل دقيقة، فالإغلاق يقع في وقته لا عند إعادة التحميل */
  const tick = useTick(60_000);
  const open = useMemo(() => openState(settings ?? null, new Date(tick)), [settings, tick]);

  return (
    <Phone
      bar={
        <TabBar<Tab>
          value={tab}
          onChange={(t) => {
            setTab(t);
            setOpenOrder(null);
          }}
          tabs={[
            { key: "menu", label: "القائمة", icon: I.menu },
            { key: "cart", label: "السلة", icon: I.cart, badge: count },
            { key: "orders", label: "طلباتي", icon: I.orders, badge: live.length },
            { key: "support", label: "الدعم", icon: I.support },
          ]}
        />
      }
    >
      <TopBar
        title={settings?.restaurant_name || "المطعم"}
        subtitle={settings ? (open.ordering ? "مفتوح الآن" : closedText(open)) : "…"}
        start={
          !shown && settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt=""
              className="size-9 shrink-0 rounded-xl object-cover"
            />
          ) : shown ? (
            <button onClick={() => setOpenOrder(null)} className="text-sm text-m-dim">
              ‹
            </button>
          ) : undefined
        }
      />

      <DataErrorBar />
      <Body>
        {shown ? (
          <>
            <Rating order={shown} onDone={() => void refreshOrders()} />
            <OrderDetail order={shown} />
          </>
        ) : tab === "menu" ? (
          <Menu
            closedNote={open.ordering ? null : closedText(open)}
            settings={settings ?? null}
            categories={categories ?? []}
            items={items ?? []}
            combos={combos ?? []}
            banners={banners ?? []}
            onOpenItem={setItem}
            onOpenCombo={setCombo}
          />
        ) : tab === "cart" ? (
          <Cart
            deliveryFee={fee}
            minOrder={Number(settings?.min_order_amount ?? 0)}
            canOrder={open.ordering}
            onCheckout={() => setCheckout(true)}
          />
        ) : tab === "orders" ? (
          <>
            {queued.length > 0 && (
              <p className="mx-4 mt-4 rounded-xl bg-m-warn/15 px-3 py-2.5 text-center text-xs text-m-warn">
                {queued.length} طلب بانتظار الاتصال — يُرسل تلقائيًا
              </p>
            )}
            <OrdersList orders={orderList} onOpen={setOpenOrder} />
          </>
        ) : (
          <Support
            settings={settings ?? null}
            deviceId={deviceId}
            tickets={tickets ?? []}
            name={profile.name}
            phone={profile.phone}
            onRefresh={refreshTickets}
          />
        )}
      </Body>

      <ItemSheet
        item={item}
        items={items ?? []}
        onClose={() => setItem(null)}
        onAdded={() => toast("أُضيف إلى السلة")}
        onOpenItem={setItem}
      />

      <ComboSheet
        combo={combo}
        items={items ?? []}
        onClose={() => setCombo(null)}
        onAdded={() => toast("أُضيفت الوجبة إلى السلة")}
      />

      <Checkout
        open={checkout}
        deviceId={deviceId}
        settings={settings ?? null}
        zones={zones ?? []}
        onClose={() => setCheckout(false)}
        onQueued={() => {
          setTab("orders");
          toast("لا اتصال — حُفظ طلبك وسيُرسل تلقائيًا");
        }}
        onPlaced={(id) => {
          void refreshOrders();
          setTab("orders");
          toast("أُرسل طلبك");
          setTimeout(() => {
            void fetchOrders({ deviceId, limit: 60 }).then((list) => {
              const o = list.find((x) => x.id === id);
              if (o) setOpenOrder(o);
            });
          }, 400);
        }}
      />

      <PopupAds ads={ads ?? []} />

      {node}
    </Phone>
  );
}
