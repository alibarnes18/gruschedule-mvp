-- Faz 5: the Telegram bot's /simdi and /programim commands need to know a
-- subscriber's exact şube (section), not just their department — a
-- department can have several sections with different schedules.
alter table notification_subscriptions
  add column section_id uuid references sections(id) on delete set null;
