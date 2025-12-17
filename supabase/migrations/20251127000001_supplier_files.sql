-- Supplier Page Overhaul - Phase 4: Internal File Manager

-- 1. Create supplier_files table
CREATE TABLE IF NOT EXISTS public.supplier_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_type text,
    file_size bigint,
    storage_path text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.supplier_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own supplier files"
    ON public.supplier_files
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 2. Setup Storage Bucket (Attempt to create if not exists)
-- Note: Creating buckets via SQL might require specific permissions or extensions.
-- We insert into storage.buckets if it doesn't exist.

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-files', 'supplier-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload supplier files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'supplier-files' AND auth.uid() = owner);

-- Policy to allow authenticated users to view their own files
CREATE POLICY "Users can view their own supplier files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'supplier-files' AND auth.uid() = owner);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own supplier files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'supplier-files' AND auth.uid() = owner);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own supplier files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'supplier-files' AND auth.uid() = owner);
