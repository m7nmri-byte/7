"use client";

import { useSyncExternalStore } from "react";

/**
 * هل نحن داخل تطبيق مثبَّت لا داخل متصفح؟
 *
 * يُكتشف من وضع العرض الذي يفرضه النظام عند التشغيل من الشاشة الرئيسية.
 * ويُحفظ في تخزين الجلسة لأن بعض المتصفحات تفقد هذه الإشارة بعد أول
 * انتقال داخلي، فيعود هيكل الموقع للظهور وسط التطبيق.
 */

const KEY = "m7nmri.standalone";
const QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
];

function detect(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(KEY) === "1") return true;
  } catch {
    /* التخزين ممنوع — نكتفي بالفحص المباشر */
  }
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const matched = iosStandalone || QUERIES.some((q) => window.matchMedia(q).matches);
  if (matched) {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* لا بأس */
    }
  }
  return matched;
}

let cached: boolean | null = null;

function getSnapshot(): boolean {
  if (cached === null) cached = detect();
  return cached;
}

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  const handler = () => {
    cached = detect();
    onChange();
  };
  lists.forEach((l) => l.addEventListener("change", handler));
  return () => lists.forEach((l) => l.removeEventListener("change", handler));
}

/** على الخادم دائمًا false — ثم يصحّحها المتصفح عند الترطيب */
export const useStandalone = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
