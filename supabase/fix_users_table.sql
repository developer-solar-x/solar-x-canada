-- Fix admin_users table: Remove password_hash column
-- Run this in Supabase SQL Editor to fix the table structure

-- Step 1: Remove the password_hash column
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Verify the table structure (optional - just to check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'admin_users' 
-- ORDER BY ordinal_position;

-- After running this, you can create the superadmin user using the API endpoint:
-- POST /api/users
-- {
--   "email": "developer@solar-x.ca",
--   "full_name": "Developer",
--   "password": "SolarX2025",
--   "role": "superadmin"
-- }

