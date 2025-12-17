-- Supplier Page Overhaul - Phase 1

-- 1. Add missing columns to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS friendly_name text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS secondary_email text,
ADD COLUMN IF NOT EXISTS secondary_phone text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS currency public.currency_code,
ADD COLUMN IF NOT EXISTS minimum_fee numeric,
ADD COLUMN IF NOT EXISTS tax_rate numeric,
ADD COLUMN IF NOT EXISTS payment_terms text,
ADD COLUMN IF NOT EXISTS po_filename_format text,
ADD COLUMN IF NOT EXISTS cat_tool text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Create Supplier Labels junction table
CREATE TABLE IF NOT EXISTS public.supplier_labels (
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (supplier_id, label_id)
);

-- Enable RLS for supplier_labels
ALTER TABLE public.supplier_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier labels"
    ON public.supplier_labels
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
