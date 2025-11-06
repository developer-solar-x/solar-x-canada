-- Simple fix for admin_users table
-- Run this in Supabase SQL Editor to fix the table structure
-- This removes password_hash and fixes the foreign key constraints

-- Step 1: Remove the password_hash column
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Drop dependent constraint first
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_created_by_fkey;

-- Step 3: Drop and recreate primary key with proper foreign key to auth.users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey CASCADE;

-- Step 4: Add foreign key to auth.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_users_id_fkey' 
    AND table_name = 'admin_users'
  ) THEN
    ALTER TABLE admin_users 
    ADD CONSTRAINT admin_users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Re-add primary key
ALTER TABLE admin_users ADD PRIMARY KEY (id);

-- Step 6: Re-add created_by foreign key
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL;

-- Step 7: Update role constraint to match new roles
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'sales'));

-- Done! Now you can create users using the API endpoint:
-- POST /api/users
-- {
--   "email": "developer@solar-x.ca",
--   "full_name": "Developer",
--   "password": "SolarX2025",
--   "role": "superadmin"
-- }

