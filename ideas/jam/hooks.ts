"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

/** جلب مع إعادة جلب عند تغيّر الجدول */
export function useLive<T>(table: string, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الجلب");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const next = await load();
        if (alive) {
          setData(next);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "تعذّر الجلب");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`jam:${table}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => void refresh())
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [table, load, refresh]);

  return { data, loading, error, refresh };
}

/* ===================== من أنا؟ ===================== */

/**
 * النظام بلا تسجيل دخول بعد، فالهويّة تُختار يدويًا ويُحفظ الاختيار.
 * كل ما يعتمد عليها — طلباتي، مهامي، بصمتي — يقرأ من هنا، فحين
 * تُضاف المصادقة يتغيّر هذا الملف وحده.
 */
const KEY = "jam.me";
let cached: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function read(): string | null {
  if (!loaded) {
    try {
      cached = localStorage.getItem(KEY);
    } catch {
      cached = null;
    }
    loaded = true;
  }
  return cached;
}

export function setMe(id: string | null) {
  cached = id;
  loaded = true;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* لا بأس */
  }
  for (const fn of listeners) fn();
}

export const useMe = (): string | null =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    read,
    () => null,
  );

/** اليوم بصيغة YYYY-MM-DD بتوقيت الجهاز */
export const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
