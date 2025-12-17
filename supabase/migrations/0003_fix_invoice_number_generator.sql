-- Fix ambiguous column reference in generate_invoice_number
create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
declare
  current_fiscal_year text := to_char(timezone('utc', now()), 'YYYY');
  next_seq integer;
begin
  insert into public.invoice_counters(fiscal_year, seq)
  values (current_fiscal_year, 1)
  on conflict(fiscal_year) do update set seq = public.invoice_counters.seq + 1
  returning seq into next_seq;

  return current_fiscal_year || '-' || lpad(next_seq::text, 4, '0');
end;
$$;
