"use client";

export type MoreKey =
  | "categories"
  | "combos"
  | "drivers"
  | "zones"
  | "banners"
  | "ads"
  | "reports"
  | "support"
  | "settings"
  | "users"
  | "hours"
  | "appearance"
  | "splash"
  | "closing"
  | "maintenance";

/** مسارات أيقونات مختصرة داخل مربّع 24×24 */
const ICON: Record<MoreKey, string> = {
  categories: "M4 6h7v5H4zM13 6h7v5h-7zM4 13h7v5H4zM13 13h7v5h-7z",
  combos: "M5 9h14l-1 9H6zM9 9V7a3 3 0 0 1 6 0v2",
  drivers: "M3 13h10V7H3zM13 10h4l4 3v3h-8z M7 19a1.6 1.6 0 1 0 0-.1M17 19a1.6 1.6 0 1 0 0-.1",
  zones: "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 9.8v.1",
  banners: "M3 6h18v9H3zM3 18h12",
  ads: "M5 10v4h3l4 3V7l-4 3zM16 9.5a3.5 3.5 0 0 1 0 5",
  reports: "M5 20V11M12 20V5M19 20v-6",
  support: "M21 12a9 9 0 1 0-3.4 7M12 8v4.5l3 1.8",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M17 11a3 3 0 1 0 0-6M20 19v-1.4a3 3 0 0 0-2-2.8",
  hours: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.5V12l3 1.8",
  appearance: "M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2a1.7 1.7 0 0 1 1.2-2.9H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3Z M7.5 12.5v.1M9.5 8.5v.1M14.5 7.5v.1",
  splash: "M5 4h14v16H5zM9 9h6M9 13h6",
  closing: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9.5 8h5M9.5 12h5",
  maintenance: "M14.7 6.3a4 4 0 0 1 5 5l-9 9-5 1 1-5 8-10Z M13 8l3 3",
  settings: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z M19.3 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.4 13H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
};

export const MORE_ITEMS: { key: MoreKey; label: string }[] = [
  { key: "categories", label: "الفئات" },
  { key: "combos", label: "الوجبات" },
  { key: "drivers", label: "المندوبون" },
  { key: "zones", label: "المناطق" },
  { key: "banners", label: "اللافتات" },
  { key: "ads", label: "الإعلانات" },
  { key: "reports", label: "التقارير" },
  { key: "support", label: "الدعم" },
  { key: "hours", label: "ساعات العمل" },
  { key: "users", label: "المستخدمون" },
  { key: "closing", label: "تقرير الإغلاق" },
  { key: "appearance", label: "المظهر" },
  { key: "splash", label: "شاشة البداية" },
  { key: "maintenance", label: "الصيانة" },
  { key: "settings", label: "الإعدادات" },
];

/** شبكة مختصرة: كل الأقسام في شاشة واحدة بلا تمرير */
export function MoreGrid({ onOpen }: { onOpen: (k: MoreKey) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 p-4">
      {MORE_ITEMS.map((m) => (
        <button
          key={m.key}
          onClick={() => onOpen(m.key)}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-m-line bg-m-surface px-1 text-center transition-colors hover:border-m-accent/40"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-6 text-m-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON[m.key]} />
          </svg>
          <span className="text-[11px] font-medium leading-tight">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
