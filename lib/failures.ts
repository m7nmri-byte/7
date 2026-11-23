"use client";

import { useSyncExternalStore } from "react";

/**
 * سجلّ أعطال مشترك بين الأنظمة.
 *
 * السبب: عشرات مواضع الحفظ والحذف كانت تُنادى بلا مَسكٍ للخطأ، فيفشل
 * الحذف ولا يُقال شيء — والمستخدم يظنّ أنّه نجح. وبدل مطاردة كل موضع،
 * تُبلِّغ طبقة قاعدة البيانات من هنا، ويعرض كل نظام شريطًا واحدًا.
 *
 * القراءة عطبٌ دائم ما دام الجدول ممنوعًا، فتبقى معروضة بمفتاحها.
 * والكتابة حدثٌ عابر، فتُعرض ثم تزول.
 */

type Scope = string;

const reads = new Map<Scope, Map<string, string>>();
const writes = new Map<Scope, { id: number; message: string } | null>();
const listeners = new Map<Scope, Set<() => void>>();

export type Failures = {
  /** جداول تعذّرت قراءتها، ما زالت متعذّرة */
  reads: { key: string; message: string }[];
  /** آخر فشل كتابة، إن لم يمضِ عليه وقت */
  write: string | null;
};

const EMPTY: Failures = { reads: [], write: null };
const snapshots = new Map<Scope, Failures>();

function emit(scope: Scope) {
  const r = reads.get(scope);
  const w = writes.get(scope) ?? null;
  snapshots.set(scope, {
    reads: r ? [...r.entries()].map(([key, message]) => ({ key, message })) : [],
    write: w ? w.message : null,
  });
  for (const fn of listeners.get(scope) ?? []) fn();
}

export function reportRead(scope: Scope, key: string, message: string | null) {
  let map = reads.get(scope);
  if (message === null) {
    if (!map?.delete(key)) return;
  } else {
    if (!map) {
      map = new Map();
      reads.set(scope, map);
    }
    if (map.get(key) === message) return;
    map.set(key, message);
  }
  emit(scope);
}

const WRITE_TTL = 9000;
let seq = 0;

export function reportWrite(scope: Scope, message: string) {
  const id = ++seq;
  writes.set(scope, { id, message });
  emit(scope);
  /** يزول وحده، فلا يبقى عطبٌ عابر معلّقًا في الشاشة */
  setTimeout(() => {
    if (writes.get(scope)?.id === id) {
      writes.set(scope, null);
      emit(scope);
    }
  }, WRITE_TTL);
}

export function clearWrite(scope: Scope) {
  if (!writes.get(scope)) return;
  writes.set(scope, null);
  emit(scope);
}

export function useFailures(scope: Scope): Failures {
  return useSyncExternalStore(
    (fn) => {
      let set = listeners.get(scope);
      if (!set) {
        set = new Set();
        listeners.set(scope, set);
      }
      set.add(fn);
      return () => {
        set?.delete(fn);
      };
    },
    () => snapshots.get(scope) ?? EMPTY,
    () => EMPTY,
  );
}
