-- Enable extensions
create extension if not exists "pgcrypto";

-- Enumerations
create type public.currency_code as enum ('USD', 'EUR', 'CAD', 'MAD', 'GBP');
create type public.job_status as enum ('created', 'in_progress', 'finished', 'invoiced', 'cancelled', 'on_hold');
create type public.pricing_type as enum ('per_word', 'per_hour', 'flat_fee');
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type public.notification_type as enum ('jobs', 'invoices', 'deadlines', 'outsourcing');

-- helper tables for numbering
create table if not exists public.job_counters (
  work_day text primary key,
  seq integer not null default 0
);

create table if not exists public.invoice_counters (
  fiscal_year text primary key,
  seq integer not null default 0
);

-- job code generator
create or replace function public.generate_job_code()
returns text
language plpgsql
as $$
declare
  today text := to_char(timezone('utc', now()), 'YYMMDD');
  next_seq integer;
begin
  insert into public.job_counters(work_day, seq)
  values (today, 1)
  on conflict(work_day) do update set seq = public.job_counters.seq + 1
  returning seq into next_seq;

  return 'VP' || today || lpad(next_seq::text, 2, '0');
end;
$$;

-- invoice number generator
create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
declare
  fiscal_year text := to_char(timezone('utc', now()), 'YYYY');
  next_seq integer;
begin
  insert into public.invoice_counters(fiscal_year, seq)
  values (fiscal_year, 1)
  on conflict(fiscal_year) do update set seq = public.invoice_counters.seq + 1
  returning seq into next_seq;

  return fiscal_year || '-' || lpad(next_seq::text, 4, '0');
end;
$$;

-- Profiles
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  currency_default public.currency_code default 'USD',
  company_name text,
  address text,
  logo_url text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  default_currency public.currency_code default 'USD',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  default_rate_word numeric,
  default_rate_hour numeric,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Jobs
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  job_code text not null unique default public.generate_job_code(),
  title text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_type text not null,
  pricing_type public.pricing_type not null,
  quantity numeric,
  rate numeric,
  currency public.currency_code not null default 'USD',
  status public.job_status not null default 'created',
  purchase_order_ref text,
  due_date date,
  start_date date,
  total_amount numeric,
  notes text,
  has_outsourcing boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists jobs_client_id_idx on public.jobs(client_id);

-- Outsourcing
create table if not exists public.outsourcing (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_rate numeric,
  supplier_currency public.currency_code not null default 'USD',
  supplier_total numeric,
  paid boolean not null default false,
  supplier_invoice_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Quotes
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_number text not null unique,
  date date,
  expiry_date date,
  items jsonb,
  total numeric,
  currency public.currency_code not null default 'USD',
  notes text,
  status public.quote_status not null default 'draft'
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null unique default public.generate_invoice_number(),
  date date,
  due_date date,
  items jsonb,
  subtotal numeric,
  tax_amount numeric,
  total numeric,
  currency public.currency_code not null default 'USD',
  html_content text,
  pdf_url text,
  notes text,
  status public.invoice_status not null default 'draft'
);

create index if not exists invoices_client_id_idx on public.invoices(client_id);

-- Purchase orders
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  number text not null,
  file_url text,
  amount numeric,
  currency public.currency_code not null default 'USD',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  date date,
  category text not null,
  amount numeric not null,
  currency public.currency_code not null default 'USD',
  supplier_name text,
  file_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Labels
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  color text not null
);

-- Storage buckets
select storage.create_bucket('job-files', false);
select storage.create_bucket('outsourcing-invoices', false);
select storage.create_bucket('invoice-pdfs', false);
select storage.create_bucket('purchase-orders', false);
select storage.create_bucket('expenses-files', false);
select storage.create_bucket('client-files', false);
select storage.create_bucket('supplier-files', false);

-- RLS
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.suppliers enable row level security;
alter table public.jobs enable row level security;
alter table public.outsourcing enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.labels enable row level security;

-- Policies helper macro
create or replace function public.is_owner(owner uuid)
returns boolean
language plpgsql
stable
as $$
begin
  return owner = auth.uid();
end;
$$;

create policy "Users can read their profile"
  on public.users
  for select
  using (id = auth.uid());

create policy "Users can manage their profile"
  on public.users
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- generic policies
do $$
declare
  tbl record;
begin
  for tbl in
    select unnest(array['clients','suppliers','jobs','outsourcing','quotes','invoices','purchase_orders','expenses','notifications','labels']) as tblname
  loop
    execute format('create policy "%I select" on public.%I for select using (public.is_owner(owner_id));', tbl.tblname, tbl.tblname);
    execute format('create policy "%I insert" on public.%I for insert with check (public.is_owner(owner_id));', tbl.tblname, tbl.tblname);
    execute format('create policy "%I update" on public.%I for update using (public.is_owner(owner_id));', tbl.tblname, tbl.tblname);
    execute format('create policy "%I delete" on public.%I for delete using (public.is_owner(owner_id));', tbl.tblname, tbl.tblname);
  end loop;
end $$;

-- Storage policies
create policy "PluriDesk bucket access"
  on storage.objects
  for all
  using (
    bucket_id in (
      'job-files',
      'outsourcing-invoices',
      'invoice-pdfs',
      'purchase-orders',
      'expenses-files',
      'client-files',
      'supplier-files'
    )
    and owner = auth.uid()
  )
  with check (
    bucket_id in (
      'job-files',
      'outsourcing-invoices',
      'invoice-pdfs',
      'purchase-orders',
      'expenses-files',
      'client-files',
      'supplier-files'
    )
    and owner = auth.uid()
  );

