-- =====================================================
-- MZIMBA SOUTH EDUDATA HUB - SUPABASE SCHEMA
-- Production-safe version preserving current web structure
-- =====================================================

-- =====================================================
-- DROP OLD TABLES
-- =====================================================

drop table if exists public.upload_history cascade;
drop table if exists public.pslce_results cascade;
drop table if exists public.enrollment cascade;
drop table if exists public.school_particulars cascade;
drop table if exists public.schools cascade;
drop table if exists public.zones cascade;

-- =====================================================
-- ZONES
-- =====================================================

create table public.zones (
  id bigint generated always as identity primary key,
  name text not null unique
);

create index idx_zones_name
on public.zones(name);

-- =====================================================
-- SCHOOLS
-- =====================================================

create table public.schools (
  id bigint generated always as identity primary key,

  emis text not null unique,
  name text not null,
  zone text not null,

  password text not null,

  districtNumber text,
  divisionNumber text,
  constituency text,
  ta text,

  postalAddress text,

  distanceFromNearestPrimary text,
  distanceToTDC text,
  distanceToDEM text,

  yearEstablished integer,

  created_at timestamptz default now()
);

create index idx_schools_emis
on public.schools(emis);

create index idx_schools_zone
on public.schools(zone);

create index idx_schools_name
on public.schools(name);

-- =====================================================
-- ENROLLMENT
-- =====================================================

create table public.enrollment (
  id bigint generated always as identity primary key,

  emis text not null,
  year integer not null,

  std1m integer default 0,
  std1f integer default 0,

  std2m integer default 0,
  std2f integer default 0,

  std3m integer default 0,
  std3f integer default 0,

  std4m integer default 0,
  std4f integer default 0,

  std5m integer default 0,
  std5f integer default 0,

  std6m integer default 0,
  std6f integer default 0,

  std7m integer default 0,
  std7f integer default 0,

  std8m integer default 0,
  std8f integer default 0,

  totalM integer default 0,
  totalF integer default 0,

  schoolName text,
  zone text,

  timestamp timestamptz default now()
);

create index idx_enrollment_emis
on public.enrollment(emis);

create index idx_enrollment_year
on public.enrollment(year);

create index idx_enrollment_zone
on public.enrollment(zone);

-- =====================================================
-- PSLCE RESULTS
-- =====================================================

create table public.pslce_results (
  id bigint generated always as identity primary key,

  emis text not null,
  year integer not null,

  enteredM integer default 0,
  enteredF integer default 0,

  satM integer default 0,
  satF integer default 0,

  passedM integer default 0,
  passedF integer default 0,

  failedM integer default 0,
  failedF integer default 0,

  nationalSecM integer default 0,
  nationalSecF integer default 0,

  districtSsM integer default 0,
  districtSsF integer default 0,

  daySecM integer default 0,
  daySecF integer default 0,

  cdssM integer default 0,
  cdssF integer default 0,

  totalSelectedM integer default 0,
  totalSelectedF integer default 0,

  schoolName text,
  zone text,

  timestamp timestamptz default now()
);

create index idx_pslce_emis
on public.pslce_results(emis);

create index idx_pslce_year
on public.pslce_results(year);

create index idx_pslce_zone
on public.pslce_results(zone);

-- =====================================================
-- SCHOOL PARTICULARS
-- =====================================================

create table public.school_particulars (
  id bigint generated always as identity primary key,

  emis text not null unique,

  headmaster text,
  phone text,
  email text,
  address text,

  timestamp timestamptz default now()
);

create index idx_school_particulars_emis
on public.school_particulars(emis);

-- =====================================================
-- UPLOAD HISTORY
-- =====================================================

create table public.upload_history (
  id bigint generated always as identity primary key,

  category text,
  emis text,

  timestamp timestamptz default now()
);

create index idx_upload_history_emis
on public.upload_history(emis);

create index idx_upload_history_category
on public.upload_history(category);

-- =====================================================
-- OPTIONAL FOREIGN KEYS
-- Safe for current frontend structure
-- =====================================================

alter table public.enrollment
add constraint fk_enrollment_school
foreign key (emis)
references public.schools(emis)
on delete cascade;

alter table public.pslce_results
add constraint fk_pslce_school
foreign key (emis)
references public.schools(emis)
on delete cascade;

alter table public.school_particulars
add constraint fk_school_particulars_school
foreign key (emis)
references public.schools(emis)
on delete cascade;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

alter table public.zones enable row level security;
alter table public.schools enable row level security;
alter table public.enrollment enable row level security;
alter table public.pslce_results enable row level security;
alter table public.school_particulars enable row level security;
alter table public.upload_history enable row level security;

-- =====================================================
-- TEMP DEVELOPMENT POLICIES
-- Replace later with secure auth-based policies
-- =====================================================

create policy "Allow all access zones"
on public.zones
for all
using (true)
with check (true);

create policy "Allow all access schools"
on public.schools
for all
using (true)
with check (true);

create policy "Allow all access enrollment"
on public.enrollment
for all
using (true)
with check (true);

create policy "Allow all access pslce_results"
on public.pslce_results
for all
using (true)
with check (true);

create policy "Allow all access school_particulars"
on public.school_particulars
for all
using (true)
with check (true);

create policy "Allow all access upload_history"
on public.upload_history
for all
using (true)
with check (true);