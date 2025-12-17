-- Add supplier_id to purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add supplier_id to expenses
ALTER TABLE expenses
ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_expenses_supplier_id ON expenses(supplier_id);
