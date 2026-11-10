-- Security check for 20261110000000_content_admin_schema.sql.
-- Run with the Supabase MCP `execute_sql` (or psql) AFTER the migration. It writes nothing: it ends by
-- raising 'SECURITY_OK' so every row it inserted is rolled back. Any other error message = a failed assertion.

create function pg_temp.fails(q text) returns boolean language plpgsql as $$
begin execute q; return false; exception when others then return true; end $$;
create function pg_temp.n(q text) returns bigint language plpgsql as $$
declare r bigint; begin execute q into r; return r; end $$;

do $$
declare
  owner_id uuid := (select u.id from auth.users u join private.owner o on lower(o.email) = lower(u.email));
  owner_claims text;
  other_claims text := json_build_object('sub', gen_random_uuid(), 'role', 'authenticated', 'email', 'someone@example.com')::text;
  rev bigint;
begin
  if owner_id is null then raise exception 'FAIL: owner user missing in auth.users'; end if;
  owner_claims := json_build_object('sub', owner_id, 'role', 'authenticated', 'email', (select email from private.owner))::text;

  -- fixture, written as the connecting superuser
  insert into public.revisions (kind, note, snapshot) values ('import', 't', '{}') returning id into rev;
  insert into public.current_revision (revision_id) values (rev);

  -- owner
  perform set_config('request.jwt.claims', owner_claims, true);
  set local role authenticated;
  if not public.is_owner() then raise exception 'FAIL: owner not recognised'; end if;
  if pg_temp.n('select count(*) from public.revisions') <> 1 then raise exception 'FAIL: owner cannot read revisions'; end if;
  if pg_temp.n('select count(*) from public.current_revision') <> 1 then raise exception 'FAIL: owner cannot read current_revision'; end if;
  if pg_temp.n('select count(*) from public.draft') <> 1 then raise exception 'FAIL: owner cannot read draft'; end if;
  if not pg_temp.fails('update public.revisions set note = ''x''') then raise exception 'FAIL: owner could update a revision'; end if;
  if not pg_temp.fails('delete from public.revisions') then raise exception 'FAIL: owner could delete a revision'; end if;
  if not pg_temp.fails('insert into public.revisions (kind, snapshot) values (''publish'', ''{}'')') then raise exception 'FAIL: owner inserted a revision directly'; end if;
  if not pg_temp.fails('update public.draft set files = ''{}''') then raise exception 'FAIL: owner wrote the draft directly'; end if;
  if not pg_temp.fails('select * from private.owner') then raise exception 'FAIL: private.owner is readable'; end if;
  reset role;

  -- a signed-in account that is not the owner
  perform set_config('request.jwt.claims', other_claims, true);
  set local role authenticated;
  if public.is_owner() then raise exception 'FAIL: stranger recognised as owner'; end if;
  if pg_temp.n('select count(*) from public.revisions') <> 0 then raise exception 'FAIL: stranger reads revisions'; end if;
  if pg_temp.n('select count(*) from public.current_revision') <> 0 then raise exception 'FAIL: stranger reads current_revision'; end if;
  if pg_temp.n('select count(*) from public.draft') <> 0 then raise exception 'FAIL: stranger reads draft'; end if;
  if not pg_temp.fails('insert into public.revisions (kind, snapshot) values (''publish'', ''{}'')') then raise exception 'FAIL: stranger inserted a revision'; end if;
  if not pg_temp.fails('update public.draft set files = ''{}''') then raise exception 'FAIL: stranger wrote the draft'; end if;
  reset role;

  -- anonymous
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  if not pg_temp.fails('select * from public.revisions') then raise exception 'FAIL: anon reads revisions'; end if;
  if not pg_temp.fails('select * from public.current_revision') then raise exception 'FAIL: anon reads current_revision'; end if;
  if not pg_temp.fails('select * from public.draft') then raise exception 'FAIL: anon reads draft'; end if;
  if not pg_temp.fails('select public.is_owner()') then raise exception 'FAIL: anon can call is_owner'; end if;
  reset role;

  raise exception 'SECURITY_OK';
end $$;
