-- Migration: Add payment tracking fields to expenses table
-- Date: 2024-12-18

-- Add paid and due_date columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create index for efficient filtering by payment status
CREATE INDEX IF NOT EXISTS idx_expenses_paid ON expenses(paid);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);

-- Comment
COMMENT ON COLUMN expenses.paid IS 'Whether the expense has been paid';
COMMENT ON COLUMN expenses.due_date IS 'When the expense is due for payment';
