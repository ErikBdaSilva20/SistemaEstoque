-- Minimal stand-in for the Better-Auth tables the real tenant-gateway creates.
-- Only what's needed to satisfy `owner_id text references "user"(id)` in the
-- business schema and to seed the user the dev gateway impersonates.
create table if not exists "user" (
  id         text primary key,
  name       text not null,
  email      text not null unique,
  created_at timestamptz not null default now()
);

insert into "user" (id, name, email)
values ('dev-admin', 'Dev Admin', 'admin@dev.local')
on conflict (id) do nothing;
