-- Keeps updated_at current on the two tables that declare it
-- (class_schedule_entries, exam_events) whenever parse-pdf rewrites a row.

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on class_schedule_entries
  for each row
  execute function set_updated_at();

create trigger set_updated_at
  before update on exam_events
  for each row
  execute function set_updated_at();
