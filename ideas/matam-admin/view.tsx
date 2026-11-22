"use client";

import { useCallback, useState } from "react";
import {
  fetchAds,
  fetchBanners,
  fetchCategories,
  fetchDrivers,
  fetchItems,
  fetchOrders,
  fetchSettings,
  fetchTickets,
  fetchZones,
} from "../matam/db";
import { useLive, useTick } from "../matam/hooks";
import { isOpenOrder } from "../matam/status";
import { Body, Phone, TabBar, TopBar } from "../matam/ui";
import { Home } from "./Home";
import { Orders } from "./Orders";
import { Items } from "./Items";
import { Categories } from "./Categories";
import { Drivers, Zones } from "./Fleet";
import { Banners } from "./Banners";
import { Reports } from "./Reports";
import { SupportDesk } from "./SupportDesk";
import { SettingsScreen } from "./Settings";

type Tab = "home" | "orders" | "menu" | "more";
type MorePage =
  | null
  | "categories"
  | "drivers"
  | "zones"
  | "banners"
  | "reports"
  | "support"
  | "settings";

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3v18M10 3v6a2 2 0 0 1-4 0M18 3c-1.5 2-2 4-2 7h4c0-3-.5-5-2-7zM18 10v11" strokeLinecap="round" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  ),
};

const MORE_ITEMS: { key: Exclude<MorePage, null>; label: string; hint: string }[] = [
  { key: "categories", label: "الفئات", hint: "تنظيم القائمة" },
  { key: "drivers", label: "المندوبون", hint: "من يوصّل الطلبات" },
  { key: "zones", label: "مناطق التوصيل", hint: "الرسوم حسب المنطقة" },
  { key: "banners", label: "اللافتات", hint: "صور أعلى قائمة الزبون" },
  { key: "reports", label: "التقارير", hint: "الإيرادات والأكثر مبيعًا" },
  { key: "support", label: "الدعم", hint: "رسائل الزبائن" },
  { key: "settings", label: "الإعدادات", hint: "المطعم وساعات العمل" },
];

export default function AdminApp() {
  const now = useTick(60_000);
  const [tab, setTab] = useState<Tab>("home");
  const [page, setPage] = useState<MorePage>(null);

  const loadOrders = useCallback(() => fetchOrders({ limit: 300 }), []);
  const { data: orders, refresh: refreshOrders } = useLive("matam_orders", loadOrders);
  const { data: settings, refresh: refreshSettings } = useLive("matam_settings", fetchSettings);
  const { data: items, refresh: refreshItems } = useLive("matam_items", fetchItems);
  const { data: categories, refresh: refreshCats } = useLive("matam_categories", fetchCategories);
  const { data: drivers, refresh: refreshDrivers } = useLive("matam_drivers", fetchDrivers);
  const { data: zones, refresh: refreshZones } = useLive("matam_zones", fetchZones);
  const { data: banners, refresh: refreshBanners } = useLive("matam_banners", fetchBanners);
  const loadTickets = useCallback(() => fetchTickets(), []);
  const { data: tickets, refresh: refreshTickets } = useLive("matam_tickets", loadTickets);
  useLive("matam_popup_ads", fetchAds);

  const all = orders ?? [];
  const waiting = all.filter((o) => o.status === "pending").length;
  const live = all.filter((o) => isOpenOrder(o.status)).length;

  const current = MORE_ITEMS.find((m) => m.key === page);

  const content = () => {
    if (page === "categories")
      return <Categories categories={categories ?? []} onChanged={refreshCats} />;
    if (page === "drivers") return <Drivers drivers={drivers ?? []} onChanged={refreshDrivers} />;
    if (page === "zones") return <Zones zones={zones ?? []} onChanged={refreshZones} />;
    if (page === "banners") return <Banners banners={banners ?? []} onChanged={refreshBanners} />;
    if (page === "reports") return <Reports orders={all} now={now} />;
    if (page === "support")
      return <SupportDesk tickets={tickets ?? []} onChanged={refreshTickets} />;
    if (page === "settings")
      return <SettingsScreen settings={settings ?? null} onChanged={refreshSettings} />;

    if (tab === "home")
      return (
        <Home
          orders={all}
          settings={settings ?? null}
          now={now}
          onChanged={refreshSettings}
          onGoOrders={() => setTab("orders")}
        />
      );
    if (tab === "orders")
      return <Orders orders={all} drivers={drivers ?? []} onChanged={refreshOrders} />;
    if (tab === "menu")
      return (
        <Items items={items ?? []} categories={categories ?? []} onChanged={refreshItems} />
      );

    return (
      <div className="flex flex-col gap-2 p-4">
        {MORE_ITEMS.map((m) => (
          <button
            key={m.key}
            onClick={() => setPage(m.key)}
            className="flex items-center justify-between gap-3 rounded-xl border border-m-line bg-m-surface p-3.5 text-start"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-[11px] text-m-dim">{m.hint}</span>
            </span>
            <span className="text-m-faint">‹</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Phone
      bar={
        <TabBar<Tab>
          value={tab}
          onChange={(t) => {
            setTab(t);
            setPage(null);
          }}
          tabs={[
            { key: "home", label: "الرئيسية", icon: ICONS.home },
            { key: "orders", label: "الطلبات", badge: live, icon: ICONS.orders },
            { key: "menu", label: "القائمة", icon: ICONS.menu },
            { key: "more", label: "المزيد", icon: ICONS.more },
          ]}
        />
      }
    >
      <TopBar
        title={current ? current.label : settings?.restaurant_name || "الإدارة"}
        subtitle={
          current
            ? current.hint
            : waiting > 0
              ? `${waiting} بانتظار القبول`
              : `${live} طلب جارٍ`
        }
        start={
          current ? (
            <button onClick={() => setPage(null)} className="text-sm text-m-dim">
              ‹
            </button>
          ) : undefined
        }
      />

      <Body>{content()}</Body>
    </Phone>
  );
}
