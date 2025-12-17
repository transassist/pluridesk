create table if not exists public.client_contacts (
    id uuid not null default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    first_name text not null,
    last_name text not null,
    email text,
    phone text,
    role text,
    is_primary boolean default false,
    created_at timestamp with time zone default now(),
    primary key (id)
);

create table if not exists public.client_activities (
    id uuid not null default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    type text not null, -- 'call', 'email', 'meeting', 'note'
    subject text not null,
    description text,
    date timestamp with time zone default now(),
    status text default 'done', -- 'done', 'todo'
    created_at timestamp with time zone default now(),
    primary key (id)
);

-- RLS Policies
alter table public.client_contacts enable row level security;
alter table public.client_activities enable row level security;

create policy "Users can view contacts of clients they have access to"
    on public.client_contacts for select
    using (true);

create policy "Users can insert contacts"
    on public.client_contacts for insert
    with check (true);

create policy "Users can update contacts"
    on public.client_contacts for update
    using (true);

create policy "Users can delete contacts"
    on public.client_contacts for delete
    using (true);

create policy "Users can view activities"
    on public.client_activities for select
    using (true);

create policy "Users can insert activities"
    on public.client_activities for insert
    with check (true);

create policy "Users can update activities"
    on public.client_activities for update
    using (true);

create policy "Users can delete activities"
    on public.client_activities for delete
    using (true);
