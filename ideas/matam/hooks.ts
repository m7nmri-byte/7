"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

/* ===================== جلب مع تحديث لحظي ===================== */

/**
 * يجلب البيانات مرة، ثم يعيد الجلب كلما تغيّر الجدول في قاعدة البيانات.
 * إعادة الجلب كاملة لا تطبيق للفروق: الجداول هنا صغيرة، والبساطة
 * أثمن من تحسين لا يُلمس أثره.
 */
export function useLive<T>(table: string, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await load();
    setData(next);
    setLoading(false);
  }, [load]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const next = await load();
      if (!alive) return;
      setData(next);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`live:${table}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [table, load, refresh]);

  return { data, loading, refresh };
}

/* ===================== معرّف الجهاز ===================== */

const DEVICE_KEY = "matam.device";

function readDevice(): string {
  let id = "";
  try {
    id = localStorage.getItem(DEVICE_KEY) ?? "";
    if (!id) {
      id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(DEVICE_KEY, id);
    }
  } catch {
    /* التخزين ممنوع — يبقى الجهاز بلا هوية */
  }
  return id;
}

let cachedDevice: string | null = null;

/** هوية الجهاز: تُميّز الزبون بلا حساب فيرى طلباته وحدها */
export function useDeviceId(): string {
  return useSyncExternalStore(
    () => () => {},
    () => {
      cachedDevice ??= readDevice();
      return cachedDevice;
    },
    () => "",
  );
}

/* ===================== ساعة حيّة ===================== */

export function useTick(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
