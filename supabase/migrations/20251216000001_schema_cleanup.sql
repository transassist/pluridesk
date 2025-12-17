-- Migration: Schema Cleanup
-- This migration addresses remaining schema inconsistencies:
-- 1. Add updated_at timestamps to tables that are missing them
-- 2. Document the Job-Invoice relationship
-- 3. Add missing indexes

-- ============================================
-- 1. Add updated_at columns where missing
-- ============================================

-- job_files
ALTER TABLE public.job_files 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- job_time_logs
ALTER TABLE public.job_time_logs
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- outsourcing
ALTER TABLE public.outsourcing
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- purchase_orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- expenses
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- labels
ALTER TABLE public.labels
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- quote_items
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- supplier_activities
ALTER TABLE public.supplier_activities
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- ============================================
-- 2. Add missing performance indexes
-- ============================================

-- outsourcing indexes
CREATE INDEX IF NOT EXISTS idx_outsourcing_job_id ON public.outsourcing(job_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_supplier_id ON public.outsourcing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_owner_id ON public.outsourcing(owner_id);

-- job_files indexes
CREATE INDEX IF NOT EXISTS idx_job_files_job_id ON public.job_files(job_id);
CREATE INDEX IF NOT EXISTS idx_job_files_owner_id ON public.job_files(owner_id);

-- job_time_logs indexes
CREATE INDEX IF NOT EXISTS idx_job_time_logs_job_id ON public.job_time_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_time_logs_owner_id ON public.job_time_logs(owner_id);

-- job_notes indexes
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON public.job_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_notes_owner_id ON public.job_notes(owner_id);

-- supplier_activities indexes
CREATE INDEX IF NOT EXISTS idx_supplier_activities_supplier_id ON public.supplier_activities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_activities_owner_id ON public.supplier_activities(owner_id);

-- purchase_orders indexes (owner_id only - no supplier_id column)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_owner_id ON public.purchase_orders(owner_id);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- quote_items indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- ============================================
-- 3. Documentation Comment: Job-Invoice Relationship
-- ============================================
-- The system supports two ways to link jobs to invoices:
-- 
-- 1. jobs.invoice_id (FK to invoices) - Simple 1:1 relationship
--    Use this when a job belongs to exactly one invoice.
--
-- 2. job_invoices (junction table) - Many-to-many relationship  
--    Use this when jobs can be split across multiple invoices
--    or when one invoice contains multiple jobs.
--
-- RECOMMENDATION: Use job_invoices junction table for new features
-- as it provides more flexibility. The jobs.invoice_id column is
-- maintained for backward compatibility.
-- ============================================
