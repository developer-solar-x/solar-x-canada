-- Create users table for admin user management
-- This table stores admin users who can access the admin panel
-- Links to Supabase Auth users table (password is managed by Supabase Auth)

-- Drop table if it exists with old schema (optional - only if you need to recreate)
-- DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'sales')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- If the table already exists with password_hash column, remove it:
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
-- Note: Adjust policies based on your security requirements
CREATE POLICY "Allow service role full access" ON admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert default admin user (password should be hashed in production)
-- Password: 'admin123' (CHANGE THIS IN PRODUCTION!)
-- You should hash this password using bcrypt before inserting
-- Example: INSERT INTO admin_users (email, full_name, password_hash, role) 
-- VALUES ('admin@solarx.ca', 'Admin User', '$2b$10$...', 'super_admin');

