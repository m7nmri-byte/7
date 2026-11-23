"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "../matam/types";
import {
  askNotifyPermission,
  chime,
  flashTitle,
  primeAudio,
  stopFlash,
  systemNotice,
} from "../matam/notify";

const SEEN_KEY = "matam.kitchen.seen";

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    // نحتفظ بآخر مئتين فقط — ما قبلها لا يعود أبدًا
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* لا بأس */
  }
}

/**
 * ينبّه عند وصول طلب لم يُرَ من قبل.
 * «المرئي» يُحفظ محليًا، فإعادة تحميل الصفحة لا تُعيد التنبيه على
 * طلبات قديمة — وهو أسوأ ما يحدث في مطبخ مشغول.
 */
export function useOrderAlerts(orders: Order[], enabled: boolean) {
  const seen = useRef<Set<string> | null>(null);
  // التفضيل محفوظ: من فعّل التنبيه مرة لا يُسأل في كل فتحة
  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("matam.kitchen.alerts") === "1";
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState(false);

  // تفعيل الصوت والإذن يحتاجان تفاعلًا — يُستدعى من زرّ في الواجهة
  const enable = async () => {
    primeAudio();
    setPermission(await askNotifyPermission());
    setReady(true);
    try {
      localStorage.setItem("matam.kitchen.alerts", "1");
    } catch {
      /* لا بأس */
    }
  };

  useEffect(() => {
    seen.current ??= loadSeen();
    const known = seen.current;

    const fresh = orders.filter((o) => o.status === "pending" && !known.has(o.id));
    if (!fresh.length) return;

    for (const o of fresh) known.add(o.id);
    saveSeen(known);

    if (!enabled || !ready) return;

    chime();
    const count = orders.filter((o) => o.status === "pending").length;
    flashTitle(`(${count}) طلب جديد`);
    if (permission) {
      const first = fresh[0];
      systemNotice(
        `طلب جديد #${first.order_number}`,
        first.items.map((i) => `${i.name} ×${i.quantity}`).join("، "),
      );
    }
  }, [orders, enabled, ready, permission]);

  // يتوقّف الوميض حين يعود الانتباه للشاشة
  useEffect(() => {
    const onFocus = () => stopFlash();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      stopFlash();
    };
  }, []);

  return { ready, enable };
}
