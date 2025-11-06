-- Setup script to create the first admin user
-- Run this after creating the admin_users table
-- This creates a user in Supabase Auth and links it to admin_users table

-- Step 1: Create user in Supabase Auth (use Supabase Dashboard or API)
-- Go to Authentication > Users > Add User
-- Or use the Supabase Management API:
-- POST https://your-project.supabase.co/auth/v1/admin/users
-- {
--   "email": "admin@solarx.ca",
--   "password": "your-secure-password",
--   "email_confirm": true
-- }

-- Step 2: After creating the auth user, get their UUID and insert into admin_users
-- Replace 'USER_UUID_HERE' with the actual UUID from auth.users
-- Replace 'your-secure-password' with a strong password

-- Example (replace USER_UUID_HERE with actual UUID):
-- INSERT INTO admin_users (id, email, full_name, role, is_active)
-- VALUES (
--   'USER_UUID_HERE',  -- Get this from auth.users after creating the user
--   'admin@solarx.ca',
--   'Admin User',
--   'superadmin',
--   true
-- );

-- Alternative: Use the API endpoint POST /api/users to create users
-- This will automatically create both the auth user and admin_users record

