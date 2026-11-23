"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { reportRead } from "@/lib/failures";

/* ===================== جلب مع تحديث لحظي ===================== */

/**
 * يجلب البيانات مرة، ثم يعيد الجلب كلما تغيّر الجدول في قاعدة البيانات.
 * إعادة الجلب كاملة لا تطبيق للفروق: الجداول هنا صغيرة، والبساطة
 * أثمن من تحسين لا يُلمس أثره.
 */
export function useLive<T>(table: string, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * الفشل يُحفظ ويُعرض. كان يُسقَط فيبدو الجدول الممنوع
   * كجدول فارغ — وشاشةٌ معطوبة تظهر سليمة أسوأ من شاشة تعترف.
   */
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
      reportRead("matam", table, null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذّر الجلب";
      setError(msg);
      reportRead("matam", table, msg);
    } finally {
      setLoading(false);
    }
  }, [load, table]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const next = await load();
        if (!alive) return;
        setData(next);
        setError(null);
        reportRead("matam", table, null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "تعذّر الجلب";
        if (alive) setError(msg);
        reportRead("matam", table, msg);
      } finally {
        if (alive) setLoading(false);
      }
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

  return { data, loading, error, refresh };
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

/* ===================== الحفظ مع الاعتراف بالفشل ===================== */

/**
 * يلفّ عملية حفظ: ينتظرها، ويُظهر «حُفِظ» عند النجاح ورسالة الخطأ عند الفشل.
 * قبله كانت شاشات الإعدادات تنادي الحفظ بلا مَسكٍ للخطأ، فالجدول الممنوع
 * يُرفض بصمت ويظنّ المستخدم أنّه حُفظ.
 */
export function useSaver() {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await fn();
      setSaved(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  /** يُنادى عند أي تعديل، فلا تبقى «حُفِظ» معلّقة فوق تغييرٍ لم يُرسل */
  const touch = useCallback(() => {
    setSaved(false);
    setError(null);
  }, []);

  return { run, touch, busy, saved, error };
}
