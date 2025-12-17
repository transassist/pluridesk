-- Migration: enhance_outsourcing_table
-- Description: Add missing columns to outsourcing table for complete functionality
-- Run this migration in your Supabase SQL Editor or via CLI

-- Add new columns to outsourcing table
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS source_language TEXT;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS target_language TEXT;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id);
ALTER TABLE outsourcing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_outsourcing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outsourcing_updated_at_trigger ON outsourcing;
CREATE TRIGGER outsourcing_updated_at_trigger
    BEFORE UPDATE ON outsourcing
    FOR EACH ROW
    EXECUTE FUNCTION update_outsourcing_updated_at();

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_outsourcing_status ON outsourcing(status);
CREATE INDEX IF NOT EXISTS idx_outsourcing_supplier_id ON outsourcing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_job_id ON outsourcing(job_id);

-- Update RLS policies if needed (outsourcing should have same owner-based RLS as other tables)
-- The existing RLS should work since we're only adding columns
