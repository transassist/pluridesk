-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS document_language text,
ADD COLUMN IF NOT EXISTS default_payment_terms text,
ADD COLUMN IF NOT EXISTS default_taxes numeric,
ADD COLUMN IF NOT EXISTS minimum_fee numeric,
ADD COLUMN IF NOT EXISTS default_file_naming text,
ADD COLUMN IF NOT EXISTS quote_validity integer,
ADD COLUMN IF NOT EXISTS cat_tool_preferences text,
ADD COLUMN IF NOT EXISTS website text;

-- Create client_files table
CREATE TABLE IF NOT EXISTS public.client_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    storage_path text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add RLS policies for client_files
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client files"
    ON public.client_files FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own client files"
    ON public.client_files FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own client files"
    ON public.client_files FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own client files"
    ON public.client_files FOR DELETE
    USING (auth.uid() = owner_id);
