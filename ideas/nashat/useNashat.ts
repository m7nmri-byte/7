"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { reportWrite } from "@/lib/failures";
import type { State } from "./types";
import { metric, normalizeState } from "./storage";
import { getServerSnapshot, getSnapshot, readState, setState, subscribe, updateState } from "./store";

const TABLE = "nashat_state";
const PUSH_DELAY = 900;

export type Sync = "offline" | "syncing" | "synced" | "error";

export function useNashat(session: Session | null) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pushState, setPushState] = useState<Exclude<Sync, "offline">>("synced");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** صدى كتابتنا يعود من التزامن اللحظي — نتجاهله مرة */
  const ourWrite = useRef(false);

  const sync: Sync = session ? pushState : "offline";

  const push = useCallback(
    async (next: State) => {
      if (!session) return;
      setPushState("syncing");
      ourWrite.current = true;
      const { error } = await supabase
        .from(TABLE)
        .upsert({ user_id: session.user.id, tasks: next.tasks, memo: next.memo });
      if (error) reportWrite("nashat", error.message);
      setPushState(error ? "error" : "synced");
    },
    [session],
  );

  /** تعديل: يُحفظ محلياً فوراً، ويُرفع بعد هدوء قصير */
  const update = useCallback(
    (fn: (s: State) => State) => {
      const next = updateState(fn);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void push(next), PUSH_DELAY);
    },
    [push],
  );

  // أول اتصال بالحساب: نوازن نسخة الخادم بالمحلية
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("tasks, memo")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;

      if (error) {
        reportWrite("nashat", error.message);
        setPushState("error");
        return;
      }

      const local = readState();
      if (!data) {
        await push(local); // حساب جديد: نزرع فيه ما على هذا الجهاز
        return;
      }

      const remote = normalizeState(data);
      // نسخة خادم أفقر من المحلية تعني كتابة سابقة لم تصل — نعيد رفع المحلية
      if (metric(remote.tasks) < metric(local.tasks)) {
        await push(local);
        return;
      }
      setState(remote);
      setPushState("synced");
    })();

    return () => {
      cancelled = true;
    };
  }, [session, push]);

  // التزامن اللحظي بين الأجهزة
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`nashat:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE,
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (ourWrite.current) {
            ourWrite.current = false;
            return;
          }
          // لا نسحب البساط من تحت من يكتب الآن
          const el = document.activeElement;
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;

          const remote = normalizeState(payload.new);
          if (metric(remote.tasks) < metric(readState().tasks)) return;
          setState(remote);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

  // رفع ما لم يُرفع بعد قبل إغلاق الصفحة
  useEffect(() => {
    const flush = () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      void push(readState());
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [push]);

  return { state, update, sync };
}
