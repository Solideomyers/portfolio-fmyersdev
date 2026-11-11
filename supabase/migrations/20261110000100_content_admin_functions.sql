-- SP10 content admin: draft / publish / restore / import functions and the deploy hook.
-- Every writer is security definer with a pinned search_path and checks the caller itself.

create extension if not exists pg_net;

-- Rebuild the site. The hook URL lives in Vault as 'deploy_hook_url'; absent = silently skipped.
-- pg_net queues the request in the caller's transaction, so a rollback cancels it.
create function private.fire_deploy_hook() returns void
language plpgsql security definer set search_path = '' as $$
declare hook text;
begin
  select decrypted_secret into hook from vault.decrypted_secrets where name = 'deploy_hook_url';
  if hook is not null then
    perform net.http_post(url := hook);
  end if;
end;
$$;
revoke all on function private.fire_deploy_hook() from public, anon, authenticated;

-- The only function anonymous callers (the site build) may use.
create function public.get_current_snapshot() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('revision', r.id, 'files', r.snapshot)
  from public.current_revision c
  join public.revisions r on r.id = c.revision_id;
$$;

-- Store an edit, or drop it when it equals the live content. null = delete this file.
create function public.draft_set_file(p text, c text) returns void
language plpgsql security definer set search_path = '' as $$
declare cur text;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  select r.snapshot ->> p into cur
  from public.current_revision cr join public.revisions r on r.id = cr.revision_id;
  if c is not distinct from cur then
    update public.draft set files = files - p;
  else
    update public.draft set files = jsonb_set(files, array[p], coalesce(to_jsonb(c), 'null'::jsonb));
  end if;
end;
$$;

create function public.draft_discard() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.draft set files = '{}'::jsonb;
end;
$$;

create function public.publish(p_note text default null) returns bigint
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
  update public.draft set files = '{}'::jsonb;
  perform private.fire_deploy_hook();
  return new_id;
end;
$$;

-- Rolling back is a new revision, never a deletion; the pending draft is left alone.
create function public.restore(p_revision bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
declare snap jsonb; new_id bigint;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  select snapshot into snap from public.revisions where id = p_revision;
  if snap is null then raise exception 'unknown revision %', p_revision; end if;
  insert into public.revisions (kind, restored_from, summary, snapshot)
  values ('restore', p_revision, 'restored REV ' || p_revision, snap) returning id into new_id;
  insert into public.current_revision (revision_id) values (new_id)
  on conflict (singleton) do update set revision_id = excluded.revision_id;
  perform private.fire_deploy_hook();
  return new_id;
end;
$$;

-- One-time (or disaster) import of the whole file map; the owner or the service role only.
create function public.import_snapshot(p_files jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare new_id bigint;
begin
  if not (public.is_owner() or auth.role() = 'service_role') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_files) <> 'object' then raise exception 'files must be an object'; end if;
  insert into public.revisions (kind, summary, snapshot)
  values ('import', 'import', p_files) returning id into new_id;
  insert into public.current_revision (revision_id) values (new_id)
  on conflict (singleton) do update set revision_id = excluded.revision_id;
  return new_id;
end;
$$;

-- Supabase grants execute to anon/authenticated by default; close it, then open exactly what is needed.
revoke all on function
  public.get_current_snapshot(), public.draft_set_file(text, text), public.draft_discard(),
  public.publish(text), public.restore(bigint), public.import_snapshot(jsonb)
  from public, anon, authenticated;
grant execute on function public.get_current_snapshot() to anon, authenticated;
grant execute on function
  public.draft_set_file(text, text), public.draft_discard(), public.publish(text), public.restore(bigint)
  to authenticated;
grant execute on function public.import_snapshot(jsonb) to authenticated, service_role;
