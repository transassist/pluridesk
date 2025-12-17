-- Job Page Overhaul Migration

-- 1. Update jobs table with new metadata
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS delivery_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS unit text, -- e.g., 'words', 'hours', 'pages'
ADD COLUMN IF NOT EXISTS language_pair_source text,
ADD COLUMN IF NOT EXISTS language_pair_target text;

-- 2. Create Time Tracking table
CREATE TABLE IF NOT EXISTS public.job_time_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration integer, -- in seconds, nullable if currently running
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for time logs
ALTER TABLE public.job_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own time logs"
    ON public.job_time_logs
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 3. Refactor Labels to be global
-- First, create the new junction table
CREATE TABLE IF NOT EXISTS public.job_labels (
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, label_id)
);

-- Enable RLS for job_labels
ALTER TABLE public.job_labels ENABLE ROW LEVEL SECURITY;

-- For the junction table, we check access via the job or label ownership (which should be the same user)
-- But since RLS checks rows, and this table doesn't have owner_id, we need to join.
-- Simpler approach: Add owner_id to junction table for easier RLS, or rely on parent access.
-- Let's add owner_id to be consistent and safe.
ALTER TABLE public.job_labels ADD COLUMN owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can manage their own job labels"
    ON public.job_labels
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Now modify the existing labels table
-- We need to migrate existing labels if any.
-- Strategy:
-- 1. Create new global labels for each unique (name, color, owner_id) tuple from the old table.
-- 2. Insert into job_labels linking the job to the new global label.
-- 3. Drop the job_id column from labels.

-- However, doing this in SQL without PL/PGSQL block is tricky if we want to preserve data perfectly.
-- Given this is a dev environment and "Your Job page currently contains ~10% of the functionality",
-- and likely little data, I will opt for a simpler approach:
-- Make `job_id` nullable in `labels` for now, or just drop it if we assume we can clean up.
-- BETTER: Let's just alter `labels` to remove `job_id` constraint and column.
-- BUT FIRST, we must populate `job_labels` with existing data.

INSERT INTO public.job_labels (job_id, label_id, owner_id)
SELECT job_id, id, owner_id
FROM public.labels
WHERE job_id IS NOT NULL;

-- Now we can drop the job_id column from labels
ALTER TABLE public.labels DROP COLUMN IF EXISTS job_id;

-- 4. Linked Entities (Quotes, Invoices)
-- We already have `invoice_id` on `jobs` (1:N or N:1?).
-- `0002_add_invoice_id_to_jobs.sql` added `invoice_id` to `jobs`. This implies a Job belongs to one Invoice.
-- But LSP.expert says "Invoices Linked to Job" (plural).
-- So we should probably have a Many-to-Many or One-to-Many (Job -> Invoices).
-- If one Job can be split across multiple invoices (partial invoicing), we need a separate table or `invoice_id` on `jobs` is insufficient.
-- Let's create `job_invoices` for flexibility.

CREATE TABLE IF NOT EXISTS public.job_invoices (
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, invoice_id)
);

ALTER TABLE public.job_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job invoices"
    ON public.job_invoices
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Migrate existing relationship if any
INSERT INTO public.job_invoices (job_id, invoice_id, owner_id)
SELECT id, invoice_id, owner_id
FROM public.jobs
WHERE invoice_id IS NOT NULL;

-- We can keep `invoice_id` on `jobs` as a "primary" invoice or just drop it.
-- Let's keep it for backward compatibility for now, or drop it to avoid confusion.
-- I'll leave it for now but the UI will use the new table.

-- Quotes
CREATE TABLE IF NOT EXISTS public.job_quotes (
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, quote_id)
);

ALTER TABLE public.job_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job quotes"
    ON public.job_quotes
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 5. Enhanced Notes (Multi-note list)
CREATE TABLE IF NOT EXISTS public.job_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job notes"
    ON public.job_notes
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Migrate existing notes
INSERT INTO public.job_notes (job_id, owner_id, content)
SELECT id, owner_id, notes
FROM public.jobs
WHERE notes IS NOT NULL AND notes != '';

-- We can optionally clear the old notes column, but keeping it is safer for now.

