-- Supplier Page Overhaul - Phase 2a: Professional Settings

-- 1. Language Pairs
CREATE TABLE IF NOT EXISTS public.supplier_language_pairs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source_language text NOT NULL,
    target_language text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_language_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier language pairs"
    ON public.supplier_language_pairs
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 2. Domains of Expertise
CREATE TABLE IF NOT EXISTS public.supplier_domains (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier domains"
    ON public.supplier_domains
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 3. Preferred Clients
CREATE TABLE IF NOT EXISTS public.supplier_preferred_clients (
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (supplier_id, client_id)
);

-- Enable RLS
ALTER TABLE public.supplier_preferred_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier preferred clients"
    ON public.supplier_preferred_clients
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
