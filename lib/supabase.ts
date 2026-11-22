import { createClient } from "@supabase/supabase-js";

/** عميل Supabase للمتصفح — نسخة واحدة تُعاد لكل من يطلبها */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } },
);
