create table if not exists beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table beta_signups enable row level security;

-- Allow anyone to insert (public beta signup)
create policy "Public insert" on beta_signups
  for insert with check (true);
