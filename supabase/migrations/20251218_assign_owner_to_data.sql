-- Migration: Assign all existing data to the user tarikandouz@gmail.com
-- This migration will find the user ID and update all tables with owner_id

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user ID for tarikandouz@gmail.com
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'tarikandouz@gmail.com'
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User tarikandouz@gmail.com not found in auth.users';
    END IF;

    RAISE NOTICE 'Found user ID: %', target_user_id;

    -- Update all tables with NULL owner_id to the target user
    -- Use COALESCE to only update rows where owner_id is NULL
    
    UPDATE public.clients 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated clients table';

    UPDATE public.suppliers 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated suppliers table';

    UPDATE public.jobs 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated jobs table';

    UPDATE public.quotes 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated quotes table';

    UPDATE public.invoices 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated invoices table';

    UPDATE public.expenses 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated expenses table';

    UPDATE public.purchase_orders 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated purchase_orders table';

    UPDATE public.outsourcing 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated outsourcing table';

    UPDATE public.notifications 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated notifications table';

    UPDATE public.labels 
    SET owner_id = target_user_id 
    WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
    RAISE NOTICE 'Updated labels table';

    -- Update additional tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_files') THEN
        UPDATE public.job_files 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated job_files table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_notes') THEN
        UPDATE public.job_notes 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated job_notes table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_time_logs') THEN
        UPDATE public.job_time_logs 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated job_time_logs table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_files') THEN
        UPDATE public.supplier_files 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated supplier_files table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_rates') THEN
        UPDATE public.supplier_rates 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated supplier_rates table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_activities') THEN
        UPDATE public.supplier_activities 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated supplier_activities table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_evaluations') THEN
        UPDATE public.supplier_evaluations 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated supplier_evaluations table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_preferred_clients') THEN
        UPDATE public.supplier_preferred_clients 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated supplier_preferred_clients table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_files') THEN
        UPDATE public.client_files 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated client_files table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_contacts') THEN
        UPDATE public.client_contacts 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated client_contacts table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_activities') THEN
        UPDATE public.client_activities 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated client_activities table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_rates') THEN
        UPDATE public.client_rates 
        SET owner_id = target_user_id 
        WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM auth.users);
        RAISE NOTICE 'Updated client_rates table';
    END IF;

    -- Ensure the user exists in public.users table
    INSERT INTO public.users (id, email)
    VALUES (target_user_id, 'tarikandouz@gmail.com')
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Ensured user exists in public.users';

    RAISE NOTICE 'Migration completed successfully. All data assigned to user: tarikandouz@gmail.com';
END $$;
