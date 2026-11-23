"use client";

import { useCallback } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { useLive } from "./hooks";

export type CardStyle = "soft" | "flat" | "outlined";
export type MenuStyle = "list" | "grid";

export type Theme = {
  primary_color: string;
  surface_color: string;
  bg_color: string;
  text_color: string;
  card_style: CardStyle;
  menu_style: MenuStyle;
};

export const DEFAULT_THEME: Theme = {
  primary_color: "#d1492a",
  surface_color: "#ffffff",
  bg_color: "#f7f5f2",
  text_color: "#1d1a17",
  card_style: "soft",
  menu_style: "list",
};

export async function fetchTheme(): Promise<Theme | null> {
  const { data, error } = await supabase.from("matam_theme").select("*").maybeSingle();
  /**
   * المظهر زينة لا شرط: لو مُنع الجدول أو تعذّر جلبه، يعمل التطبيق
   * بلونه الافتراضي ولا يُزعج المستخدم بشريط خطأ عن ألوان.
   */
  if (error) return null;
  return (data as Theme) ?? null;
}

/** يجلب المظهر ويهيّئ ما يُلبَس به الجذر */
export function useTheme() {
  const load = useCallback(() => fetchTheme(), []);
  const { data } = useLive("matam_theme", load);
  const theme = data ?? DEFAULT_THEME;
  return { theme, style: themeStyle(theme), card: theme.card_style };
}

const isColor = (v: string | null | undefined): v is string =>
  typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v.trim());

/**
 * يترجم المظهر إلى متغيّرات CSS تُلبَس على جذر التطبيق.
 *
 * الألوان المشتقّة تُحسب من الأصل بـ color-mix بدل أن تُترك ثابتة:
 * لو اختار المدير لوحة ليليّة داكنة وبقيت الحدود والنصوص الباهتة
 * على ألوان النهار لصار النص غير مقروء.
 */
export function themeStyle(t: Theme): CSSProperties {
  const bg = isColor(t.bg_color) ? t.bg_color : DEFAULT_THEME.bg_color;
  const surface = isColor(t.surface_color) ? t.surface_color : DEFAULT_THEME.surface_color;
  const text = isColor(t.text_color) ? t.text_color : DEFAULT_THEME.text_color;
  const accent = isColor(t.primary_color) ? t.primary_color : DEFAULT_THEME.primary_color;

  const mix = (a: string, pct: number, b: string) =>
    `color-mix(in oklab, ${a} ${pct}%, ${b})`;

  return {
    "--m-bg": bg,
    "--m-surface": surface,
    "--m-text": text,
    "--m-accent": accent,
    "--m-raised": mix(text, 6, surface),
    "--m-line": mix(text, 14, surface),
    "--m-dim": mix(text, 62, bg),
    "--m-faint": mix(text, 42, bg),
    "--m-accent-soft": mix(accent, 12, surface),
  } as CSSProperties;
}
