# Setup First Superadmin User

## ⚠️ IMPORTANT: Fix Table Schema First

If you're getting an error about `password_hash` column, run this SQL first:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;
```

Or run the complete migration script: `supabase/migrate_users_table.sql`

## Quick Setup (Recommended)

### Option 1: Use the API Endpoint (Easiest)

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Create the superadmin user by calling the API:
   ```bash
   # Using curl (Linux/Mac/Git Bash)
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "developer@solar-x.ca",
       "full_name": "Developer",
       "password": "SolarX2025",
       "role": "superadmin"
     }'

   # Using PowerShell (Windows)
   Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -ContentType "application/json" -Body '{"email":"developer@solar-x.ca","full_name":"Developer","password":"SolarX2025","role":"superadmin"}'
   ```

3. Or use the setup endpoint:
   ```bash
   # Using curl
   curl -X POST http://localhost:3000/api/admin/setup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "developer@solar-x.ca",
       "password": "SolarX2025",
       "full_name": "Developer"
     }'
   ```

### Option 2: Use Supabase Dashboard

1. Go to your Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter:
   - Email: `developer@solar-x.ca`
   - Password: `SolarX2025`
   - Auto Confirm User: ✅ Yes
4. Click "Create User"
5. Copy the User UUID that appears
6. Go to SQL Editor and run:
   ```sql
   INSERT INTO admin_users (id, email, full_name, role, is_active)
   VALUES (
     'PASTE_USER_UUID_HERE',  -- Replace with the UUID from step 4
     'developer@solar-x.ca',
     'Developer',
     'superadmin',
     true
   );
   ```

### Option 3: Use the Admin Panel (After First Login)

If you already have access to the admin panel:
1. Go to the Users section
2. Click "Add User"
3. Fill in the form:
   - Email: `developer@solar-x.ca`
   - Full Name: `Developer`
   - Password: `SolarX2025`
   - Role: `Super Admin`
   - Active: ✅ Yes
4. Click "Create User"

## Login Credentials

After setup, you can login with:
- **Email:** developer@solar-x.ca
- **Password:** SolarX2025
- **Role:** superadmin

## Verify Setup

1. Go to `/admin/login`
2. Enter the credentials above
3. You should be logged in as a superadmin
4. Go to the Users section to verify your account

## Troubleshooting

If you get an error that the user already exists:
- The user might already be created in Supabase Auth
- Check the `admin_users` table to see if the record exists
- If it exists but role is not superadmin, update it:
  ```sql
  UPDATE admin_users 
  SET role = 'superadmin' 
  WHERE email = 'developer@solar-x.ca';
  ```

