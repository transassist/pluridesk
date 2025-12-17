# PluriDesk - Deployment Guide

## ✅ Database Deployment Complete!

Your Supabase database has been successfully deployed with all tables, functions, and Row Level Security policies.

---

## 🚀 Quick Start Guide

### 1. Update Environment Variables

Your `.env` file should contain:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://rmavktscqxgarjykfazc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYXZrdHNjcXhnYXJqeWtmYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTE1MTUsImV4cCI6MjA3ODcyNzUxNX0.M1cHUQgYgzySOz173uC0Wero1WSYg8kAP0ibWXmfAnc

# Get these from: https://supabase.com/dashboard/project/rmavktscqxgarjykfazc/settings/api
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
SUPABASE_DB_PASSWORD=<your-db-password>

# CRITICAL: Your Auth User UUID (see step 2 below)
PLURIDESK_OWNER_ID=<your-auth-user-uuid>

# Project Info
SUPABASE_PROJECT_ID=rmavktscqxgarjykfazc
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Create Your First User

**Important**: You must create a user via Supabase Auth before using the app.

#### Via Supabase Dashboard (Recommended):

1. Go to: https://supabase.com/dashboard/project/rmavktscqxgarjykfazc/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Enter your email and password
4. **Copy the UUID** of the created user
5. Update `.env` with `PLURIDESK_OWNER_ID=<that-uuid>`

#### Via SQL (After creating Auth user):

Go to: https://supabase.com/dashboard/project/rmavktscqxgarjykfazc/sql/new

Run this query (replace `YOUR-AUTH-UUID` and `your@email.com`):

```sql
INSERT INTO public.users (id, email, name, company_name, currency_default)
VALUES 
  ('YOUR-AUTH-UUID', 'your@email.com', 'Your Name', 'PluriDesk Studio', 'USD');
```

---

### 3. Seed Test Data (Optional)

After creating your user, add some test data:

```sql
-- Replace YOUR-UUID with your actual user UUID

-- Add a test client
INSERT INTO public.clients (owner_id, name, email, default_currency, contact_name, phone)
VALUES 
  ('YOUR-UUID', 'Acme Corporation', 'contact@acme.com', 'USD', 'John Doe', '+1-555-1234');

-- Add a test supplier  
INSERT INTO public.suppliers (owner_id, name, email, default_rate_word, default_rate_hour)
VALUES 
  ('YOUR-UUID', 'Translation Services Inc', 'vendor@translations.com', 0.10, 50.00);

-- Get the client_id from the query above, then create a test job
-- First, get your client_id:
SELECT id, name FROM public.clients WHERE owner_id = 'YOUR-UUID';

-- Then create a job (replace CLIENT-UUID with the id from above):
INSERT INTO public.jobs (
  owner_id, 
  title, 
  client_id, 
  service_type, 
  pricing_type, 
  quantity, 
  rate, 
  currency, 
  status, 
  total_amount
)
VALUES (
  'YOUR-UUID',
  'Website Translation - French',
  'CLIENT-UUID',
  'Translation',
  'per_word',
  5000,
  0.15,
  'USD',
  'in_progress',
  750.00
);
```

---

### 4. Start the Development Server

```bash
cd /Users/tarikkhachiaa/Documents/PluriDesk
npm run dev
```

Visit: **http://localhost:3000**

---

## 📊 Deployed Tables

All tables have Row Level Security (RLS) enabled:

- ✅ **users** - User profiles and company settings
- ✅ **clients** - Client CRM
- ✅ **suppliers** - Supplier/vendor management
- ✅ **jobs** - Job tracking with auto-generated codes
- ✅ **outsourcing** - Job-to-supplier linking
- ✅ **quotes** - Pre-sales quotes with line items
- ✅ **invoices** - Billing with auto-generated numbers
- ✅ **purchase_orders** - PO tracking
- ✅ **expenses** - Business expense tracking
- ✅ **notifications** - In-app notifications
- ✅ **labels** - Job tagging system

---

## 🔧 Troubleshooting

### Issue: "Unable to load data"

**Cause**: Missing `PLURIDESK_OWNER_ID` in `.env`

**Solution**: 
1. Create a user via Supabase Auth
2. Copy the UUID
3. Add it to `.env` as `PLURIDESK_OWNER_ID`
4. Insert that user into `public.users` table
5. Restart dev server

### Issue: "Row Level Security" errors

**Cause**: User not in `public.users` table

**Solution**: Run the INSERT query from Step 2 above

### Issue: Missing API keys

**Cause**: Environment variables not set

**Solution**: Get keys from: https://supabase.com/dashboard/project/rmavktscqxgarjykfazc/settings/api

---

## 🎯 Next Steps

1. ✅ Create your Auth user
2. ✅ Add user to `public.users` table
3. ✅ Add test client
4. ✅ Create first job
5. ✅ Explore the dashboard!

---

## 📞 Support

- Supabase Dashboard: https://supabase.com/dashboard/project/rmavktscqxgarjykfazc
- Database URL: `postgresql://postgres.[PROJECT-ID]:***@db.rmavktscqxgarjykfazc.supabase.co:5432/postgres`
- API URL: https://rmavktscqxgarjykfazc.supabase.co

---

## 🔒 Security Notes

- ✅ All user tables have RLS enabled
- ✅ Policies enforce owner_id = auth.uid()
- ✅ Service role key should NEVER be exposed to client
- ⚠️ Storage buckets need to be created manually (see below)

### Storage Buckets (Optional)

If you need file uploads, create these buckets in the Supabase Dashboard:

- `job-files`
- `outsourcing-invoices` 
- `invoice-pdfs`
- `purchase-orders`
- `expenses-files`
- `client-files`
- `supplier-files`

All buckets should be **private** with RLS policies.

---

Happy tracking! 🚀

