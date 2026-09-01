-- Gruschedule core schema (spec.md section 3)
-- Table order follows foreign key dependencies:
-- faculties -> departments -> sections
-- source_documents (referenced by the four content tables below)
-- class_schedule_entries, exam_events, academic_calendar_events, menu_days
-- notification_subscriptions

create extension if not exists pgcrypto;

create table faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references faculties(id) on delete cascade,
  name text not null,
  slug text not null
);

-- ders programı bölüm bazlı değil, çoğu zaman sınıf + şube bazlı değişir
create table sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  grade_level int not null, -- 1, 2, 3, 4
  section_label text -- 'A', 'B' gibi, tek şube varsa null
);

-- kaynak PDF takibi: hangi PDF'ten geldi, hash neydi (değişiklik tespiti için)
create table source_documents (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  document_type text not null check (document_type in ('exam_schedule', 'academic_calendar', 'menu', 'class_schedule')),
  content_hash text not null,
  fetched_at timestamptz default now(),
  parse_status text default 'pending' check (parse_status in ('pending', 'success', 'failed', 'needs_review'))
);

create table class_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references sections(id) on delete cascade,
  course_name text not null,
  instructor text,
  day_of_week int not null check (day_of_week between 1 and 7), -- 1=Pazartesi
  start_time time not null,
  end_time time not null,
  location text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exam_events (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  exam_type text not null check (exam_type in ('midterm', 'final', 'makeup')),
  course_name text not null,
  exam_date date not null,
  exam_time time,
  location text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table academic_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  description text,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now()
);

create table menu_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  items text[] not null,
  source_document_id uuid references source_documents(id),
  created_at timestamptz default now()
);

-- kullanıcı bildirim tercihleri (Telegram chat_id bazlı, auth yok)
create table notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text unique not null,
  department_id uuid references departments(id),
  created_at timestamptz default now()
);

create index on departments (faculty_id);
create index on sections (department_id);
create index on class_schedule_entries (section_id);
create index on exam_events (department_id);
create index on exam_events (exam_date);
create index on notification_subscriptions (department_id);
