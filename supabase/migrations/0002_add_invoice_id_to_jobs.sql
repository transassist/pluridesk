-- Add invoice_id to jobs table
alter table public.jobs 
add column if not exists invoice_id uuid references public.invoices(id) on delete set null;

-- Add index for performance
create index if not exists jobs_invoice_id_idx on public.jobs(invoice_id);
