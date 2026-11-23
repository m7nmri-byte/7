import type { State } from "./types";
import { emptyState, loadLocal, saveLocal } from "./storage";

/**
 * مخزن خارجي صغير تقرأه React عبر useSyncExternalStore.
 * البديل — حالة داخل المكوّن مع مرجع يُحدَّث أثناء التصيير — يخالف
 * قواعد React ويسبّب قراءات قديمة في دوال الاستدعاء.
 */

const SERVER: State = { tasks: [], memo: [] };

let current: State = emptyState();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** أول قراءة في المتصفح تجلب المحفوظ محلياً، ثم تُخزَّن النسخة */
export function getSnapshot(): State {
  if (!loaded) {
    current = loadLocal();
    loaded = true;
  }
  return current;
}

/** على الخادم لا تخزين — نعيد مرجعاً ثابتاً حتى لا يختلف التصيير */
export const getServerSnapshot = (): State => SERVER;

/** تعيين الحالة مع الحفظ المحلي */
export function setState(next: State) {
  if (next === current) return;
  current = next;
  loaded = true;
  saveLocal(next);
  emit();
}

export function updateState(fn: (s: State) => State) {
  const next = fn(getSnapshot());
  setState(next);
  return next;
}

export const readState = getSnapshot;
