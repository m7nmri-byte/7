import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * هل وصلت إعدادات الاتصال وقت البناء؟
 * بدون هذا الفحص يحاول المتصفح الاتصال بعنوان فارغ، فيظهر الخطأ
 * وكأنه انقطاع شبكة — وهو في الحقيقة متغيّر بيئة مفقود.
 */
export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder",
  { auth: { persistSession: true, autoRefreshToken: true } },
);
