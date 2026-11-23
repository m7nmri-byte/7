"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Order } from "./types";
import { createOrder } from "./db";

/**
 * طابور الطلبات المعلّقة.
 *
 * الطلب الذي يفشل إرساله — انقطاع شبكة أو خطأ عابر — يُحفظ محليًا
 * ويُعاد إرساله حين تعود الشبكة. بدون هذا يكتب الزبون طلبه ثم يضيع،
 * وهو أسوأ ما يحدث في تطبيق طلبات.
 */

export type PendingOrder = Omit<Order, "id" | "order_number" | "created_at" | "updated_at">;

type Entry = {
  key: string;
  order: PendingOrder;
  tries: number;
  at: string;
  /** سبب آخر محاولة فاشلة، ليُقال لصاحب الطلب */
  error?: string;
};

/**
 * حدّ المحاولات. بعده يتوقّف الطابور عن المحاولة ويُبقي الطلب
 * ظاهرًا لصاحبه. قبل هذا الحدّ كان `tries` يُزاد ولا يُفحص، فالطلب
 * المرفوض لسببٍ ثابت يُعاد إرساله كل نصف دقيقة إلى الأبد.
 */
const MAX_TRIES = 10;

export const isStuck = (e: Entry) => e.tries >= MAX_TRIES;

const KEY = "matam.queue";
const EMPTY: Entry[] = [];

let queue: Entry[] = [];
let loaded = false;
let sending = false;
const listeners = new Set<() => void>();

function read(): Entry[] {
  if (!loaded) {
    try {
      queue = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Entry[];
    } catch {
      queue = [];
    }
    loaded = true;
  }
  return queue;
}

function write(next: Entry[]) {
  queue = next;
  loaded = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* لا بأس */
  }
  for (const fn of listeners) fn();
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export function enqueue(order: PendingOrder) {
  write([
    ...read(),
    {
      key: "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      order,
      tries: 0,
      at: new Date().toISOString(),
    },
  ]);
}

/** محاولة إرسال ما في الطابور — تُستدعى عند عودة الشبكة ودوريًا */
export async function flushQueue(): Promise<number> {
  if (sending) return 0;
  const items = read();
  if (!items.length) return 0;

  sending = true;
  let sent = 0;
  const left: Entry[] = [];

  for (const entry of items) {
    /** المتوقّف لا يُحاول، ويبقى في الطابور ليراه صاحبه ويتصرّف */
    if (isStuck(entry)) {
      left.push(entry);
      continue;
    }
    try {
      await createOrder(entry.order, { quiet: true });
      sent++;
    } catch (e) {
      left.push({
        ...entry,
        tries: entry.tries + 1,
        error: e instanceof Error ? e.message : "تعذّر الإرسال",
      });
    }
  }

  write(left);
  sending = false;
  return sent;
}

export const useQueue = (): Entry[] => useSyncExternalStore(subscribe, read, () => EMPTY);

/** إسقاط طلب معلّق — لمن تعذّر إرساله ولم يعد يريده */
export function dropQueued(key: string) {
  write(read().filter((e) => e.key !== key));
}

/** إعادة المحاولة يدويًا: تصفير العدّاد يُخرجه من حالة التوقّف */
export function retryQueued(key: string) {
  write(read().map((e) => (e.key === key ? { ...e, tries: 0, error: undefined } : e)));
  void flushQueue();
}

/** يراقب عودة الشبكة ويحاول دوريًا */
export function useQueueFlusher(onSent?: (n: number) => void) {
  useEffect(() => {
    const run = () => {
      void flushQueue().then((n) => {
        if (n > 0) onSent?.(n);
      });
    };
    run();
    window.addEventListener("online", run);
    const id = setInterval(run, 30_000);
    return () => {
      window.removeEventListener("online", run);
      clearInterval(id);
    };
  }, [onSent]);
}
