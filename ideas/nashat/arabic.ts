/**
 * مطابقة العدد في العربية.
 * forms = [صفر، مفرد، مثنّى، جمع ٣–١٠، تمييز ١١+]
 */
export function arCount(n: number, forms: readonly string[]) {
  if (n === 0) return forms[0];
  if (n === 1) return forms[1];
  if (n === 2) return forms[2];
  const r = n % 100;
  return r >= 3 && r <= 10 ? `${n} ${forms[3]}` : `${n} ${forms[4]}`;
}

export const F_SWITCH = ["بلا أي تنقّل", "تنقّل واحد", "تنقّلان", "تنقّلات", "تنقّلًا"] as const;
export const F_PENDING = ["لا مهام معلّقة", "مهمة معلّقة واحدة", "مهمتان معلّقتان", "مهام معلّقة", "مهمة معلّقة"] as const;
export const F_DAY = ["", "يوم واحد", "يومان", "أيام", "يومًا"] as const;
export const F_SESSION = ["لا جلسات", "جلسة واحدة", "جلستان", "جلسات", "جلسة"] as const;
export const F_DEEP = ["", "جلسة عميقة واحدة", "جلستين عميقتين", "جلسات عميقة", "جلسة عميقة"] as const;

/** عمر مقروء بالساعات: دقائق ثم ساعات ثم أيام */
export function ageText(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} دقيقة`;
  if (hours < 24) {
    const h = Math.round(hours);
    return h === 1 ? "ساعة" : h === 2 ? "ساعتين" : `${h} ساعات`;
  }
  const d = Math.round(hours / 24);
  return d === 1 ? "يوم" : d === 2 ? "يومين" : `${d} أيام`;
}
