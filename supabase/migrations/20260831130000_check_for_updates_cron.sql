-- Faz 3: automation. pg_cron triggers check-for-updates over HTTP via
-- pg_net every 6 hours (spec.md section 4).
--
-- The Edge Function URL and service_role key are read from Supabase
-- Vault at call time, NOT hardcoded here — this file is committed to
-- git and must never contain a real key. Before this cron job can
-- actually reach the function, run the following ONCE in the Supabase
-- SQL Editor (not as a migration, so the values never touch this repo):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
--
-- (Project URL and service_role key: Project Settings > API.)

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- cron.schedule() with an existing job name updates that job in place,
-- so re-running this migration is safe.
select cron.schedule(
  'check-for-updates-every-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/check-for-updates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);
