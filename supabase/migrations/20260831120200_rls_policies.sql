-- RLS (spec.md section 3): public tables get an open select policy.
-- All writes happen through Edge Functions using the service_role key,
-- which bypasses RLS entirely, so no insert/update/delete policies exist
-- for anon/authenticated on any table.

alter table faculties enable row level security;
alter table departments enable row level security;
alter table sections enable row level security;
alter table source_documents enable row level security;
alter table class_schedule_entries enable row level security;
alter table exam_events enable row level security;
alter table academic_calendar_events enable row level security;
alter table menu_days enable row level security;
alter table notification_subscriptions enable row level security;

-- Public read tables per spec: faculties, departments, exam_events,
-- academic_calendar_events, menu_days. sections and class_schedule_entries
-- are also public-read: the /ders-programi page needs them and they carry
-- no sensitive data.
create policy "public read" on faculties for select using (true);
create policy "public read" on departments for select using (true);
create policy "public read" on sections for select using (true);
create policy "public read" on class_schedule_entries for select using (true);
create policy "public read" on exam_events for select using (true);
create policy "public read" on academic_calendar_events for select using (true);
create policy "public read" on menu_days for select using (true);

-- source_documents (internal parse bookkeeping) and
-- notification_subscriptions (telegram_chat_id) get no public policies —
-- RLS is enabled with zero policies, so anon/authenticated have no access
-- and only the service_role key (which bypasses RLS) can read or write them.
