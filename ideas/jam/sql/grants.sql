-- ============================================================
--  صلاحيات نظام (جمعية) — انسخ هذا الملف كلّه والصقه في:
--  Supabase Dashboard > SQL Editor > Run
-- ============================================================
--  الجداول موجودة لكنّها مقفلة تمامًا، فلا يظهر في النظام شيء.
--  هذا الأمر يفتحها لمن سجّل دخوله في الموقع وحده.
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

-- ترقيم الطلبات والمخاطبات يحتاج صلاحية على التسلسل نفسه
grant usage, select on sequence public.jam_requests_number_seq   to authenticated;
grant usage, select on sequence public.jam_mail_number_seq       to authenticated;
grant usage, select on sequence public.jam_request_logs_id_seq   to authenticated;
grant usage, select on sequence public.jam_task_updates_id_seq   to authenticated;
