-- ============================================================
--  صلاحيات جداول نظام (جمعية)
--  شغّلها من: Supabase Dashboard > SQL Editor
-- ============================================================
--
--  حالة الجداول الآن: موجودة، وبلا أي صلاحية لأي دور.
--  فلا المتصفّح (anon) ولا الخادم (service_role) يقرأ منها.
--  ما لم تُشغّل هذا الملف، لن يظهر في النظام شيء.
--
--  اقرأ قبل أن تشغّل:
--
--  الخيار (أ) أدناه يفتح الجداول للمفتاح العام anon.
--  هذا المفتاح منشور في حزمة المتصفّح — أي أحد يملك رابط
--  موقعك يستطيع استخراجه، ومن ثَمّ قراءة وكتابة كل شيء:
--  أسماء المستفيدين، أرقام هوياتهم، الرواتب، القيود المالية،
--  محاضر الاجتماعات المقيّدة. هذا هو نفس ما عليه جداول
--  «مطعم» عندك، ومقبولٌ هناك لأنّ بياناتها تجريبية.
--  بيانات الجمعية ليست كذلك.
--
--  الخيار (ب) يفتحها لمن سجّل دخوله فقط (authenticated).
--  هو الصحيح لنظام فيه بيانات أشخاص. يحتاج منك:
--    ١. تسجيل دخول في النظام (الموقع فيه /login جاهز)
--    ٢. ربط hooks.ts بالجلسة بدل الاختيار اليدوي للهويّة
--  وهو تغيير في ملف واحد كما كُتب في ideas/jam/hooks.ts
--
--  اختر واحدًا، واحذف الآخر.
-- ============================================================


-- ============================================================
--  (أ) مفتوح للمتصفّح بلا تسجيل دخول — للتجربة وحدها
-- ============================================================
/*
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public' and tablename like 'jam!_%' escape '!'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('drop policy if exists jam_open on public.%I', t);
    execute format(
      'create policy jam_open on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to anon, authenticated;
*/


-- ============================================================
--  (ب) لمن سجّل دخوله فقط — الموصى به
-- ============================================================

do $$
declare t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public' and tablename like 'jam!_%' escape '!'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists jam_members_only on public.%I', t);
    execute format(
      'create policy jam_members_only on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- التسلسلات: ترقيم الطلبات والمخاطبات يحتاج صلاحية على التسلسل نفسه
grant usage, select on sequence public.jam_requests_number_seq to authenticated;
grant usage, select on sequence public.jam_mail_number_seq to authenticated;
grant usage, select on sequence public.jam_request_logs_id_seq to authenticated;
grant usage, select on sequence public.jam_task_updates_id_seq to authenticated;


-- ============================================================
--  للتحقّق بعد التشغيل
-- ============================================================
-- select tablename, rowsecurity from pg_tables
--   where schemaname='public' and tablename like 'jam!_%' escape '!';
-- select tablename, policyname, roles from pg_policies
--   where schemaname='public' and tablename like 'jam!_%' escape '!';
