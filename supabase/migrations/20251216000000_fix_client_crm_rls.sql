-- Migration: Create Client CRM Tables with Proper Security
-- Based on actual database state:
-- - client_rates EXISTS but WITHOUT owner_id
-- - client_contacts and client_activities DO NOT exist

-- ============================================
-- 1. Create client_contacts table (new, with owner_id)
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    role text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- ============================================
-- 2. Create client_activities table (new, with owner_id)
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_activities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    subject text NOT NULL,
    description text,
    date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'done',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- ============================================
-- 3. Alter client_rates to add owner_id column
-- ============================================

ALTER TABLE public.client_rates 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.client_rates 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Backfill owner_id from parent client
UPDATE public.client_rates cr
SET owner_id = c.owner_id
FROM public.clients c
WHERE cr.client_id = c.id
AND cr.owner_id IS NULL;

-- Make owner_id NOT NULL after backfill (only if there's data)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.client_rates WHERE owner_id IS NULL) THEN
        ALTER TABLE public.client_rates ALTER COLUMN owner_id SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- 4. Enable RLS on all tables
-- ============================================

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_rates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Drop any existing insecure policies on client_rates
-- ============================================

DROP POLICY IF EXISTS "Users can view rates of clients they have access to" ON public.client_rates;
DROP POLICY IF EXISTS "Users can insert rates" ON public.client_rates;
DROP POLICY IF EXISTS "Users can update rates" ON public.client_rates;
DROP POLICY IF EXISTS "Users can delete rates" ON public.client_rates;

-- ============================================
-- 6. Create SECURE RLS policies (owner_id based)
-- ============================================

-- client_contacts
CREATE POLICY "Users can view their own client contacts"
    ON public.client_contacts FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own client contacts"
    ON public.client_contacts FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own client contacts"
    ON public.client_contacts FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own client contacts"
    ON public.client_contacts FOR DELETE
    USING (auth.uid() = owner_id);

-- client_activities
CREATE POLICY "Users can view their own client activities"
    ON public.client_activities FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own client activities"
    ON public.client_activities FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own client activities"
    ON public.client_activities FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own client activities"
    ON public.client_activities FOR DELETE
    USING (auth.uid() = owner_id);

-- client_rates
CREATE POLICY "Users can view their own client rates"
    ON public.client_rates FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own client rates"
    ON public.client_rates FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own client rates"
    ON public.client_rates FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own client rates"
    ON public.client_rates FOR DELETE
    USING (auth.uid() = owner_id);

-- ============================================
-- 7. Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_owner_id ON public.client_contacts(owner_id);

CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_owner_id ON public.client_activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_date ON public.client_activities(date);

CREATE INDEX IF NOT EXISTS idx_client_rates_client_id ON public.client_rates(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rates_owner_id ON public.client_rates(owner_id);
