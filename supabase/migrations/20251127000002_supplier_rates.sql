-- Create supplier_rates table
CREATE TABLE IF NOT EXISTS public.supplier_rates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_name text NOT NULL,
    rate numeric NOT NULL,
    unit text NOT NULL, -- e.g., 'word', 'hour', 'page', 'project'
    currency text NOT NULL DEFAULT 'USD',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier rates"
    ON public.supplier_rates
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
