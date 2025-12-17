-- Add purchase_order_id to outsourcing table
ALTER TABLE outsourcing
ADD COLUMN purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;

-- Make job_id in purchase_orders nullable
ALTER TABLE purchase_orders
ALTER COLUMN job_id DROP NOT NULL;

-- Add index for performance
CREATE INDEX idx_outsourcing_purchase_order_id ON outsourcing(purchase_order_id);
