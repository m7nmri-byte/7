"use client";

import { useState, useSyncExternalStore } from "react";
import type { Member, Settings } from "./types";
import { ROLE_LABEL } from "./types";
import { setMe } from "./hooks";
import { NAV, type SectionKey } from "./nav";

function Glyph({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

/** منتقي الهويّة — بديل مؤقّت عن تسجيل الدخول */
function Who({ members, me }: { members: Member[]; me: string | null }) {
  const [open, setOpen] = useState(false);
  const current = members.find((m) => m.id === me) ?? null;

  return (
    <div className="relative border-t border-j-line p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start hover:bg-j-raised"
      >
        {current?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.avatar_url} alt="" className="size-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-j-brand/12 text-xs font-bold text-j-brand">
            {current ? current.name.trim().charAt(0) : "؟"}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">
            {current ? current.name : "اختر هويّتك"}
          </span>
          <span className="block truncate text-[10px] text-j-faint">
            {current ? (current.job_title || ROLE_LABEL[current.role]) : "لتعرف ما يخصّك"}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full start-3 end-3 mb-1 max-h-72 overflow-y-auto rounded-xl border border-j-line bg-j-surface p-1 shadow-j-md">
          {members.length === 0 ? (
            <p className="px-3 py-3 text-[11px] text-j-faint">أضف أعضاء أوّلًا</p>
          ) : (
            members.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMe(m.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs hover:bg-j-raised " +
                  (m.id === me ? "text-j-brand" : "")
                }
              >
                <span className="flex-1 truncate">{m.name}</span>
                <span className="shrink-0 text-[10px] text-j-faint">{ROLE_LABEL[m.role]}</span>
              </button>
            ))
          )}
          {me && (
            <button
              onClick={() => {
                setMe(null);
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-start text-[11px] text-j-danger hover:bg-j-raised"
            >
              إلغاء الاختيار
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const OPEN_KEY = "jam.nav.open";

/**
 * القسم المفتوح — واحدٌ لا أكثر.
 *
 * مخزنٌ خارجي لا حالةُ مكوّن: قراءة التخزين المحلي في مُهيّئ الحالة
 * تجري على الخادم أيضًا فتعود فارغة، ثم يقرأ المتصفّح غيرها —
 * فتختلف الصفحة المبنيّة مسبقًا عمّا يُرسم بعد الترطيب.
 * و"" تعني «طويتُ الكلّ عمدًا»، تمييزًا لها عن «لم أختر بعد».
 */
let cached: string | null = null;
let loaded = false;
const openListeners = new Set<() => void>();

function readOpen(): string | null {
  if (!loaded) {
    try {
      cached = localStorage.getItem(OPEN_KEY);
    } catch {
      cached = null;
    }
    loaded = true;
  }
  return cached;
}

function writeOpen(next: string | null) {
  cached = next;
  loaded = true;
  try {
    if (next === null) localStorage.removeItem(OPEN_KEY);
    else localStorage.setItem(OPEN_KEY, next);
  } catch {
    /* لا بأس */
  }
  for (const fn of openListeners) fn();
}

const useStoredOpen = () =>
  useSyncExternalStore(
    (fn) => {
      openListeners.add(fn);
      return () => {
        openListeners.delete(fn);
      };
    },
    readOpen,
    () => null,
  );

/** القسم الذي تنتمي إليه شاشةٌ بعينها */
const groupOf = (key: string): string | null =>
  NAV.find((g) => g.label && g.items.some((i) => i.key === key))?.label ?? null;

export function Sidebar({
  section,
  onGo,
  settings,
  members,
  me,
  badges,
}: {
  section: SectionKey;
  onGo: (s: SectionKey) => void;
  settings: Settings | null;
  members: Member[];
  me: string | null;
  /** أرقام تُعرض بجانب بنود بعينها */
  badges: Partial<Record<SectionKey, number>>;
}) {
  const [open, setOpen] = useState(false);
  /**
   * أكورديون: فتح عنوانٍ يطوي البقية.
   * وقبل أي اختيار يُفتح القسم الذي فيه الشاشة الحالية، فيعرف
   * المستخدم أين هو من غير أن يبحث.
   */
  const stored = useStoredOpen();
  const openGroup = stored === null ? groupOf(section) : stored === "" ? null : stored;

  const toggleFold = (label: string) => writeOpen(openGroup === label ? "" : label);

  const list = (
    <>
      <div className="flex items-center gap-2.5 border-b border-j-line px-4 py-4">
        {settings?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt=""
            className="size-9 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-j-brand text-sm font-bold text-white">
            ج
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{settings?.name || "جمعية"}</span>
          <span className="block truncate text-[10px] text-j-faint">نظام إداري داخلي</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((g) => {
          const shut = Boolean(g.label) && g.label !== openGroup;
          /** ما ينتظرك في قسمٍ مطويّ يظهر على عنوانه، فلا يُخفيه الطيّ */
          const hidden = shut
            ? g.items.reduce((n, it) => n + (badges[it.key] ?? 0), 0)
            : 0;

          return (
          <div key={g.label || "top"} className="mb-1">
            {g.label && (
              <button
                onClick={() => toggleFold(g.label)}
                aria-expanded={!shut}
                className="flex w-full items-center gap-1.5 rounded-lg px-3 pb-1 pt-3 text-start text-[10px] font-semibold tracking-wide text-j-faint hover:text-j-dim"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className={"size-3 shrink-0 transition-transform " + (shut ? "-rotate-90" : "")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span className="flex-1">{g.label}</span>
                {hidden > 0 && (
                  <span className="mark rounded-full bg-j-warn/15 px-1.5 text-[10px] font-bold text-j-warn">
                    {hidden}
                  </span>
                )}
              </button>
            )}
            {!shut &&
            g.items.map((it) => {
              const on = section === it.key;
              const n = badges[it.key] ?? 0;
              return (
                <button
                  key={it.key}
                  onClick={() => {
                    onGo(it.key);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-xs transition-colors " +
                    (on
                      ? "bg-j-brand/10 font-semibold text-j-brand"
                      : "text-j-dim hover:bg-j-raised hover:text-j-text")
                  }
                >
                  <Glyph path={it.icon} />
                  <span className="flex-1 truncate">{it.label}</span>
                  {n > 0 && (
                    <span className="mark shrink-0 rounded-full bg-j-warn/15 px-1.5 text-[10px] font-bold text-j-warn">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          );
        })}
      </nav>

      <Who members={members} me={me} />
    </>
  );

  return (
    <>
      {/* سطح المكتب */}
      <aside className="hidden w-60 shrink-0 flex-col border-e border-j-line bg-j-surface lg:flex">
        {list}
      </aside>

      {/* الجوال: زرّ ودرج */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 end-4 z-30 grid size-12 place-items-center rounded-full bg-j-brand text-white shadow-j-md lg:hidden"
        aria-label="القائمة"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="إغلاق"
          />
          <aside className="relative flex w-64 flex-col border-e border-j-line bg-j-surface">
            {list}
          </aside>
        </div>
      )}
    </>
  );
}
