"use client";

import { useSyncExternalStore } from "react";

/**
 * تاريخ اليوم بصيغة YYYY-MM-DD، ويُقرأ في المتصفح وحده.
 * على الخادم يعود بـ null، فيُقدَّم الهيكل فارغاً ثم يملؤه المتصفح —
 * وهذا يمنع اختلاف ما وُلّد وقت البناء عمّا يراه الزائر.
 */
let cached: string | null = null;

function clientToday(): string {
  if (!cached) {
    const now = new Date();
    cached = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    )
      .toISOString()
      .slice(0, 10);
  }
  return cached;
}

const subscribe = () => () => {};

export function useToday(): string | null {
  return useSyncExternalStore(subscribe, clientToday, () => null);
}
