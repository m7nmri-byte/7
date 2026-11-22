/** أنماط عناصر الإدخال والأزرار — مشتركة بين الموقع وأدواته */

export const field =
  "w-full rounded-xl border border-edge bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/60";

export const btn =
  "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40";

export const btnPrimary = `${btn} bg-brand text-[#15202b] hover:brightness-110`;
export const btnGhost = `${btn} border border-edge text-ink hover:bg-paper`;
export const btnDanger = `${btn} text-[#e08a7a] hover:bg-[#2b1f1d]`;
