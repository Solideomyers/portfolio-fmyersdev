-- SP10 content admin: tables, owner-only access, immutable revisions.
-- Content = a map { repoPath: fileText } per revision (see docs/superpowers/specs/2026-11-03-sp10-content-admin-design.md).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Exactly one authorised account. Never exposed through the API (schema private).
create table private.owner (email text primary key);
insert into private.owner (email) values ('fmyersdev@gmail.com');

create table public.revisions (
  id bigint generated always as identity primary key, -- the REV number
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('import', 'publish', 'restore')),
  restored_from bigint references public.revisions (id),
  note text,
  summary text,
  snapshot jsonb not null
);

create table public.current_revision (
  singleton boolean primary key default true check (singleton),
  revision_id bigint not null references public.revisions (id)
);

-- Working copy: only the edited files; a null value means "delete this file".
create table public.draft (
  singleton boolean primary key default true check (singleton),
  files jsonb not null default '{}'::jsonb
);
insert into public.draft default values;

-- Revisions never change once written (rollback = a new revision).
create function public.revisions_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'revisions are immutable';
end;
$$;
create trigger revisions_no_update_delete
  before update or delete on public.revisions
  for each row execute function public.revisions_immutable();

-- True only for the verified owner account. Security definer: reads auth.users and private.owner.
create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join private.owner o on lower(o.email) = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- RLS: owner reads everything; nobody writes directly (publish/restore/draft functions come next).
alter table public.revisions enable row level security;
alter table public.current_revision enable row level security;
alter table public.draft enable row level security;

create policy owner_select on public.revisions for select to authenticated using (public.is_owner());
create policy owner_select on public.current_revision for select to authenticated using (public.is_owner());
create policy owner_select on public.draft for select to authenticated using (public.is_owner());

revoke all on public.revisions, public.current_revision, public.draft from public, anon, authenticated;
grant select on public.revisions, public.current_revision, public.draft to authenticated;
