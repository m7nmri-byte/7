-- ============================================================
--  الخطة الاستراتيجية والتشغيلية، والحوكمة، والعطل الرسمية
-- ============================================================

-- ---------- المنظورات والأهداف والمؤشّرات ----------

create table if not exists public.jam_perspectives (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- بادئة رموز الأهداف: س ص م ل ت
  prefix      text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.jam_objectives (
  id             uuid primary key default gen_random_uuid(),
  perspective_id uuid not null references public.jam_perspectives(id) on delete cascade,
  -- رمز الهدف كما في الوثيقة: «س 1»
  code           text not null,
  name           text not null,
  description    text,
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (perspective_id, code)
);

create table if not exists public.jam_indicators (
  id            uuid primary key default gen_random_uuid(),
  objective_id  uuid not null references public.jam_objectives(id) on delete cascade,
  -- رمز المؤشر كما في الوثيقة: «س 1 - 1»
  code          text not null,
  name          text not null,
  description   text,
  -- وحدة القياس: مبادرة، مستفيد، نسبة، ريال، تقرير…
  unit          text,
  formula       text,
  -- دورية القياس: quarterly | semi | yearly
  frequency     text not null default 'quarterly',
  -- اتجاه التحسّن: up للزيادة، down للنقص
  polarity      text not null default 'up',
  -- التراكمية: مصدر قاعدة حساب المتحقق السنوي لا وحدة القياس.
  --   false ← يبدأ من الصفر كل ربع، فالسنوي مجموع الأرباع.
  --   true  ← القيمة مستوى قائم يحتوي آخرُ قياسٍ له ما قبله،
  --           فالسنوي آخر ربعٍ له متحقق. وجمعُها يُخرج ٣٤٠٪.
  cumulative    boolean not null default false,
  owner         text,
  exec_owner    text,
  measure_owner text,
  -- خط الأساس: قيمة المؤشر قبل تنفيذ الخطة
  baseline      numeric,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (objective_id, code)
);

create table if not exists public.jam_indicator_results (
  id           uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.jam_indicators(id) on delete cascade,
  year         int  not null,
  -- year | q1 | q2 | q3 | q4
  period       text not null,
  target       numeric,
  actual       numeric,
  -- active | postponed (يُستثنى من المتوسطات) | no_data (يُحتسب صفرًا)
  state        text not null default 'active',
  -- للفترة year وحدها: متحقق أُدخل يدويًا فيتجاوز الحساب التراكمي
  is_override  boolean not null default false,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (indicator_id, year, period)
);

-- ---------- الخطة التشغيلية ----------

create table if not exists public.jam_plans (
  id          uuid primary key default gen_random_uuid(),
  -- «أغسطس ٢٠٢٦ — ديسمبر ٢٠٢٦»
  label       text not null unique,
  start_date  date not null,
  end_date    date not null,
  week_count  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.jam_initiatives (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.jam_plans(id) on delete cascade,
  -- رقم المبادرة في الكشاف
  number         int  not null,
  name           text not null,
  description    text,
  objective_id   uuid references public.jam_objectives(id) on delete set null,
  duration_text  text,
  manager_id     uuid references public.jam_members(id) on delete set null,
  department_id  uuid references public.jam_departments(id) on delete set null,
  -- high | mid | low
  priority       text,
  start_date     date,
  end_date       date,
  budget         numeric not null default 0,
  -- توزيع الموازنة على أشهر الخطة: { "2026-08": 0, "2026-09": 18150 }
  -- مفاتيحه أشهر لا أسماء، فلا يرتبط بفترة خطةٍ بعينها
  monthly_budget jsonb not null default '{}'::jsonb,
  marketing_url  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (plan_id, number)
);

create table if not exists public.jam_initiative_steps (
  id                uuid primary key default gen_random_uuid(),
  initiative_id     uuid not null references public.jam_initiatives(id) on delete cascade,
  sort_order        int  not null default 0,
  -- prep | exec | close
  phase             text,
  title             text not null,
  -- شاهد التنفيذ: الوثيقة التي تُثبت إنجاز الخطوة
  evidence          text,
  owner_id          uuid references public.jam_members(id) on delete set null,
  cost              numeric not null default 0,
  actual_cost       numeric not null default 0,
  -- أرقام أسابيع نسبية إلى بداية الخطة، تبدأ من ١
  plan_start_week   int,
  plan_weeks        int,
  actual_start_week int,
  actual_weeks      int,
  -- نسبة إنجاز الخطوة ٠-١٠٠، وهي المُدخل الوحيد ومنها تُحسب نسبة المبادرة
  progress          int  not null default 0,
  monthly_cost      jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.jam_initiative_indicators (
  initiative_id uuid not null references public.jam_initiatives(id) on delete cascade,
  indicator_id  uuid not null references public.jam_indicators(id) on delete cascade,
  primary key (initiative_id, indicator_id)
);

-- ---------- الحوكمة ----------

create table if not exists public.jam_governance (
  id            uuid primary key default gen_random_uuid(),
  -- معرّف السؤال في دليل المعايير
  question_id   text not null unique,
  -- not_started | in_progress | done | not_applicable
  status        text not null default 'not_started',
  proof_url     text,
  note          text,
  updated_at    timestamptz not null default now()
);

-- ---------- العطل الرسمية ----------

create table if not exists public.jam_holidays (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now()
);

create index if not exists jam_objectives_persp_idx  on public.jam_objectives(perspective_id, sort_order);
create index if not exists jam_indicators_obj_idx    on public.jam_indicators(objective_id, sort_order);
create index if not exists jam_results_period_idx    on public.jam_indicator_results(year, period);
create index if not exists jam_initiatives_plan_idx  on public.jam_initiatives(plan_id, number);
create index if not exists jam_steps_init_idx        on public.jam_initiative_steps(initiative_id, sort_order);
create index if not exists jam_holidays_range_idx    on public.jam_holidays(start_date, end_date);

-- لمسة التحديث على ما له updated_at
do $$
declare t text;
begin
  for t in select unnest(array[
    'jam_objectives','jam_indicators','jam_indicator_results',
    'jam_initiatives','jam_initiative_steps'])
  loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I for each row execute function public.jam_touch()', t, t);
  end loop;
end $$;
