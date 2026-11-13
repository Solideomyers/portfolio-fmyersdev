-- Fix for 20261110000100_content_admin_functions.sql.
-- Supabase loads pg_safeupdate for API requests (authenticator: session_preload_libraries =
-- supautils, safeupdate), which rejects an UPDATE without WHERE: "UPDATE requires a WHERE clause".
-- draft_set_file, draft_discard and publish updated the one-row `draft` table without one, so every
-- call through the API failed with a 400 (the SQL editor runs as a superuser, where the check is off,
-- which is why the behaviour test did not see it). `where singleton` is the table's primary key.

create or replace function public.draft_set_file(p text, c text) returns void
language plpgsql security definer set search_path = '' as $$
declare cur text;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  select r.snapshot ->> p into cur
  from public.current_revision cr join public.revisions r on r.id = cr.revision_id;
  if c is not distinct from cur then
    update public.draft set files = files - p where singleton;
  else
    update public.draft set files = jsonb_set(files, array[p], coalesce(to_jsonb(c), 'null'::jsonb))
    where singleton;
  end if;
end;
$$;

create or replace function public.draft_discard() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.draft set files = '{}'::jsonb where singleton;
end;
$$;

create or replace function public.publish(p_note text default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare d jsonb; cur jsonb; merged jsonb; summ text; new_id bigint;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  select files into d from public.draft for update;
  if d = '{}'::jsonb then raise exception 'nothing to publish'; end if;
  select coalesce(r.snapshot, '{}'::jsonb) into cur
  from public.current_revision cr join public.revisions r on r.id = cr.revision_id;
  cur := coalesce(cur, '{}'::jsonb);

  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into merged from (
    select key as k, value as v from jsonb_each(cur) where not d ? key
    union all
    select key, value from jsonb_each(d) where jsonb_typeof(value) <> 'null'
  ) m;
  select string_agg(k, ', ' order by k) into summ from jsonb_object_keys(d) k;

  insert into public.revisions (kind, note, summary, snapshot)
  values ('publish', p_note, summ, merged) returning id into new_id;
  insert into public.current_revision (revision_id) values (new_id)
  on conflict (singleton) do update set revision_id = excluded.revision_id;
  update public.draft set files = '{}'::jsonb where singleton;
  perform private.fire_deploy_hook();
  return new_id;
end;
$$;

-- create or replace keeps the grants made by the original migration (execute for authenticated only).
