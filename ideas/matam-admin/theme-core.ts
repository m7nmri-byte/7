/** النوع والافتراضي من مصدرٍ واحد يقرؤه التطبيق كما تكتبه الإدارة */
export type { Theme } from "../matam/theme";
export { DEFAULT_THEME } from "../matam/theme";
import type { Theme } from "../matam/theme";

export type Splash = {
  id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};


/** لوحات جاهزة — أسرع من اختيار أربعة ألوان متناسقة يدويًا */
export const PRESETS: {
  name: string;
  primary_color: string;
  bg_color: string;
  surface_color: string;
  text_color: string;
}[] = [
  { name: "طوبيّ", primary_color: "#d1492a", bg_color: "#f7f5f2", surface_color: "#ffffff", text_color: "#1d1a17" },
  { name: "أخضر", primary_color: "#1f7a4d", bg_color: "#f4f7f4", surface_color: "#ffffff", text_color: "#13201a" },
  { name: "نيليّ", primary_color: "#24508f", bg_color: "#f3f5f9", surface_color: "#ffffff", text_color: "#141a26" },
  { name: "عنبريّ", primary_color: "#b8791a", bg_color: "#faf6ef", surface_color: "#ffffff", text_color: "#211a10" },
  { name: "ليليّ", primary_color: "#e0923c", bg_color: "#16140f", surface_color: "#201d17", text_color: "#f0ebe3" },
];

export const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: "primary_color", label: "اللون المميّز" },
  { key: "bg_color", label: "الخلفية" },
  { key: "surface_color", label: "البطاقات" },
  { key: "text_color", label: "النص" },
];
