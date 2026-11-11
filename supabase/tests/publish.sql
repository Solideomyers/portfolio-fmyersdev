-- Behaviour check for 20261110000100_content_admin_functions.sql.
-- Run with the Supabase MCP `execute_sql` (or psql) AFTER the migration. It writes nothing: it ends by
-- raising 'PUBLISH_OK' so every row (and any queued deploy-hook request) is rolled back.
-- Any other error message = a failed assertion.

create function pg_temp.fails(q text) returns boolean language plpgsql as $$
begin execute q; return false; exception when others then return true; end $$;

do $$
declare
  owner_id uuid := (select u.id from auth.users u join private.owner o on lower(o.email) = lower(u.email));
  owner_claims text;
  other_claims text := json_build_object('sub', gen_random_uuid(), 'role', 'authenticated', 'email', 'someone@example.com')::text;
  r1 bigint; r2 bigint; r3 bigint; r4 bigint;
  s jsonb;
begin
  if owner_id is null then raise exception 'FAIL: owner user missing in auth.users'; end if;
  owner_claims := json_build_object('sub', owner_id, 'role', 'authenticated', 'email', (select email from private.owner))::text;
  update public.draft set files = '{}';

  perform set_config('request.jwt.claims', owner_claims, true);
  set local role authenticated;

  -- import = first revision + pointer
  r1 := public.import_snapshot('{"a.md":"A1","b.md":"B1"}');
  s := public.get_current_snapshot();
  if (s->>'revision')::bigint <> r1 or s->'files' <> '{"a.md":"A1","b.md":"B1"}' then raise exception 'FAIL: import did not become current'; end if;

  -- draft stores only real changes
  perform public.draft_set_file('a.md', 'A2');
  perform public.draft_set_file('b.md', 'B1');
  if (select files from public.draft) <> '{"a.md":"A2"}' then raise exception 'FAIL: draft should hold only a.md'; end if;
  perform public.draft_set_file('a.md', 'A1');
  if (select files from public.draft) <> '{}' then raise exception 'FAIL: reverting a file should drop it from the draft'; end if;

  -- publish merges the draft over the current files and empties it
  perform public.draft_set_file('a.md', 'A2');
  r2 := public.publish('first edit');
  s := public.get_current_snapshot();
  if r2 <= r1 or (s->>'revision')::bigint <> r2 or s->'files' <> '{"a.md":"A2","b.md":"B1"}' then raise exception 'FAIL: publish result wrong'; end if;
  if (select files from public.draft) <> '{}' then raise exception 'FAIL: publish left the draft full'; end if;
  if (select summary from public.revisions where id = r2) <> 'a.md' then raise exception 'FAIL: publish summary wrong'; end if;
  if not pg_temp.fails('select public.publish()') then raise exception 'FAIL: publish with empty draft succeeded'; end if;

  -- restore copies an old snapshot into a NEW revision and keeps pending drafts
  perform public.draft_set_file('c.md', 'C1');
  r3 := public.restore(r1);
  s := public.get_current_snapshot();
  if r3 <= r2 or (s->>'revision')::bigint <> r3 or s->'files' <> '{"a.md":"A1","b.md":"B1"}' then raise exception 'FAIL: restore result wrong'; end if;
  if (select files from public.draft) <> '{"c.md":"C1"}' then raise exception 'FAIL: restore touched the draft'; end if;
  if (select snapshot from public.revisions where id = r1) <> '{"a.md":"A1","b.md":"B1"}' then raise exception 'FAIL: old revision changed'; end if;
  if not pg_temp.fails('select public.restore(-1)') then raise exception 'FAIL: restore of unknown revision succeeded'; end if;

  -- a null draft value deletes the file in the next snapshot
  perform public.draft_set_file('b.md', null);
  r4 := public.publish();
  s := public.get_current_snapshot();
  if s->'files' <> '{"a.md":"A1","c.md":"C1"}' then raise exception 'FAIL: null draft value did not delete b.md'; end if;

  -- discard
  perform public.draft_set_file('a.md', 'X');
  perform public.draft_discard();
  if (select files from public.draft) <> '{}' then raise exception 'FAIL: discard left files'; end if;
  reset role;

  -- a signed-in stranger: everything but get_current_snapshot raises
  perform set_config('request.jwt.claims', other_claims, true);
  set local role authenticated;
  if public.get_current_snapshot() is null then raise exception 'FAIL: stranger cannot read the public snapshot'; end if;
  if not pg_temp.fails($q$select public.draft_set_file('a.md','Z')$q$) then raise exception 'FAIL: stranger edited the draft'; end if;
  if not pg_temp.fails('select public.draft_discard()') then raise exception 'FAIL: stranger discarded the draft'; end if;
  if not pg_temp.fails('select public.publish()') then raise exception 'FAIL: stranger published'; end if;
  if not pg_temp.fails('select public.restore(' || r1 || ')') then raise exception 'FAIL: stranger restored'; end if;
  if not pg_temp.fails($q$select public.import_snapshot('{}')$q$) then raise exception 'FAIL: stranger imported'; end if;
  reset role;

  -- anonymous: only get_current_snapshot
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  if public.get_current_snapshot() is null then raise exception 'FAIL: anon cannot read the public snapshot'; end if;
  if not pg_temp.fails($q$select public.draft_set_file('a.md','Z')$q$) then raise exception 'FAIL: anon edited the draft'; end if;
  if not pg_temp.fails('select public.draft_discard()') then raise exception 'FAIL: anon discarded the draft'; end if;
  if not pg_temp.fails('select public.publish()') then raise exception 'FAIL: anon published'; end if;
  if not pg_temp.fails('select public.restore(' || r1 || ')') then raise exception 'FAIL: anon restored'; end if;
  if not pg_temp.fails($q$select public.import_snapshot('{}')$q$) then raise exception 'FAIL: anon imported'; end if;
  reset role;

  raise exception 'PUBLISH_OK';
end $$;
