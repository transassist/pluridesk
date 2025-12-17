create table if not exists public.client_rates (
    id uuid not null default gen_random_uuid(),
    client_id uuid not null references public.clients(id) on delete cascade,
    service_type text not null, -- e.g., 'Translation', 'Editing'
    source_language text,
    target_language text,
    unit text not null, -- e.g., 'word', 'hour', 'page'
    rate numeric not null,
    currency text not null,
    created_at timestamp with time zone default now(),
    primary key (id)
);

-- RLS Policies
alter table public.client_rates enable row level security;

create policy "Users can view rates of clients they have access to"
    on public.client_rates for select
    using (true);

create policy "Users can insert rates"
    on public.client_rates for insert
    with check (true);

create policy "Users can update rates"
    on public.client_rates for update
    using (true);

create policy "Users can delete rates"
    on public.client_rates for delete
    using (true);
