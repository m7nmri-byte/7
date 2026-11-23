-- ============================================================
--  ثلاثة جداول في نظام المطعم ترفض المتصفّح (401)، فشاشاتها
--  في الإدارة واجهةٌ بلا قاعدة:
--     matam_theme   →  شاشة «المظهر»
--     matam_splash  →  شاشة «شاشة الإقلاع»
--     matam_users   →  شاشة «العملاء»
--
--  انسخ الملف كلّه والصقه في:
--  Supabase Dashboard > SQL Editor > Run
-- ============================================================


-- ============================================================
--  (١) المظهر وشاشة الإقلاع — إعدادات عرض لا بيانات أشخاص
--      تُفتح للمتصفّح كبقية جداول المطعم
-- ============================================================

do $$
declare t text;
begin
  for t in select unnest(array['matam_theme','matam_splash'])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('drop policy if exists matam_open on public.%I', t);
    execute format(
      'create policy matam_open on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;


-- ============================================================
--  (٢) جدول العملاء — فيه أسماء وأرقام هواتف
--      لا يُفتح للعموم. لمن سجّل دخوله وحده.
--      أي أنّ شاشة «العملاء» تعمل بعد تسجيل الدخول في الموقع.
-- ============================================================

alter table public.matam_users enable row level security;
grant select, insert, update, delete on public.matam_users to authenticated;
drop policy if exists matam_users_signed_in on public.matam_users;
create policy matam_users_signed_in on public.matam_users
  for all to authenticated using (true) with check (true);


-- ============================================================
--  للتحقّق بعد التشغيل
-- ============================================================
-- select tablename, policyname, roles::text from pg_policies
--   where schemaname='public'
--     and tablename in ('matam_theme','matam_splash','matam_users');
