"use client";

import { useSyncExternalStore } from "react";

export type DeviceKey = "customer" | "kitchen" | "admin" | "driver";

/** الأجهزة وألوانها — وحدة خفيفة تقرأ منها القائمة بلا سحب التطبيقات */
export const DEVICES: { key: DeviceKey; label: string; tint: string }[] = [
  { key: "customer", label: "العميل", tint: "#d1492a" },
  { key: "kitchen", label: "المطبخ", tint: "#2e7d57" },
  { key: "admin", label: "الإدارة", tint: "#2f6fa8" },
  { key: "driver", label: "المندوب", tint: "#b8791a" },
];

/** المندوب مغلق ابتداءً: دوره يأتي بعد أن يجهز الطلب */
const DEFAULT: DeviceKey[] = ["customer", "kitchen", "admin"];
const KEY = "matam.bench";

let active: DeviceKey[] = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function snapshot(): DeviceKey[] {
  if (!loaded) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        active = DEVICES.filter((d) => parsed.includes(d.key)).map((d) => d.key);
      }
    } catch {
      /* التخزين ممنوع — نبقى على الافتراضي */
    }
    loaded = true;
  }
  return active;
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export function toggleDevice(key: DeviceKey) {
  const cur = snapshot();
  const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
  // الترتيب يتبع ترتيب الأجهزة لا ترتيب الضغط
  active = DEVICES.filter((d) => next.includes(d.key)).map((d) => d.key);
  try {
    localStorage.setItem(KEY, JSON.stringify(active));
  } catch {
    /* لا بأس */
  }
  for (const fn of listeners) fn();
}

export const useDevices = (): DeviceKey[] =>
  useSyncExternalStore(subscribe, snapshot, () => DEFAULT);
