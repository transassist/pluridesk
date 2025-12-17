-- Supplier Page Overhaul - Phase 2b: CRM & Quality

-- 1. Supplier Activities (CRM)
CREATE TYPE public.activity_type AS ENUM ('email', 'call', 'meeting', 'note', 'other');

CREATE TABLE IF NOT EXISTS public.supplier_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type public.activity_type NOT NULL DEFAULT 'note',
    subject text NOT NULL,
    description text,
    date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier activities"
    ON public.supplier_activities
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 2. Supplier Evaluations (Quality)
CREATE TABLE IF NOT EXISTS public.supplier_evaluations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL, -- Optional link to a job
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    criteria jsonb DEFAULT '{}'::jsonb, -- Flexible JSON for detailed scoring
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier evaluations"
    ON public.supplier_evaluations
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
