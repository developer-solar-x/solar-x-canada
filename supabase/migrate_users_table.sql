-- Migration script to update admin_users table for Supabase Auth
-- Run this if you already have the admin_users table with password_hash column

-- Step 1: Remove the password_hash column (if it exists)
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Update the foreign key to reference auth.users (if not already set)
-- First, check if the column exists and if the constraint is correct
DO $$
BEGIN
  -- Check if id column exists and doesn't have the correct foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'id'
  ) THEN
    -- Drop dependent foreign key constraint first (created_by depends on primary key)
    ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_created_by_fkey;
    
    -- Drop existing primary key constraint (CASCADE to handle any other dependencies)
    ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey CASCADE;
    
    -- Add foreign key constraint to auth.users (if not exists)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'admin_users_id_fkey' 
      AND table_name = 'admin_users'
    ) THEN
      ALTER TABLE admin_users 
      ADD CONSTRAINT admin_users_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Re-add primary key
    ALTER TABLE admin_users ADD PRIMARY KEY (id);
    
    -- Re-add the created_by foreign key constraint
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'admin_users_created_by_fkey' 
      AND table_name = 'admin_users'
    ) THEN
      ALTER TABLE admin_users 
      ADD CONSTRAINT admin_users_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Step 3: Update role constraint to match new roles
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'sales'));

-- Step 4: Verify the table structure
-- You can run this to check:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'admin_users' 
-- ORDER BY ordinal_position;

