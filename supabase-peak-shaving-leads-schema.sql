-- Peak Shaving Sales Calculator Lead Capture Schema
-- Run this SQL in your Supabase SQL Editor to create the lead capture system

-- Table to store lead email addresses and verification status
CREATE TABLE IF NOT EXISTS peak_shaving_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT, -- 6-digit code
  verification_code_expires_at TIMESTAMPTZ, -- Code expires after 15 minutes
  verification_attempts INTEGER DEFAULT 0, -- Track failed verification attempts
  usage_count INTEGER DEFAULT 0, -- Track how many times they've used the calculator (max 2)
  is_solar_x_email BOOLEAN DEFAULT FALSE, -- TRUE if email ends with @solar-x.ca (unlimited access)
  last_used_at TIMESTAMPTZ, -- Last time they accessed the calculator
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_email UNIQUE (email),
  CONSTRAINT valid_usage_count CHECK (usage_count >= 0 AND usage_count <= 2 OR is_solar_x_email = TRUE)
);

-- Table to track individual calculator access sessions
CREATE TABLE IF NOT EXISTS peak_shaving_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES peak_shaving_leads(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT, -- Optional: track IP for security
  user_agent TEXT, -- Optional: track browser info
  
  -- Index for quick lookups
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES peak_shaving_leads(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_peak_shaving_leads_email ON peak_shaving_leads(email);
CREATE INDEX IF NOT EXISTS idx_peak_shaving_leads_verified ON peak_shaving_leads(email_verified);
CREATE INDEX IF NOT EXISTS idx_peak_shaving_leads_solar_x ON peak_shaving_leads(is_solar_x_email);
CREATE INDEX IF NOT EXISTS idx_peak_shaving_access_logs_lead_id ON peak_shaving_access_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_peak_shaving_access_logs_accessed_at ON peak_shaving_access_logs(accessed_at);

-- Create updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_peak_shaving_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_peak_shaving_leads_updated_at ON peak_shaving_leads;
CREATE TRIGGER update_peak_shaving_leads_updated_at 
  BEFORE UPDATE ON peak_shaving_leads
  FOR EACH ROW 
  EXECUTE FUNCTION update_peak_shaving_leads_updated_at();

-- Function to automatically detect @solar-x.ca emails
CREATE OR REPLACE FUNCTION check_solar_x_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_solar_x_email if email ends with @solar-x.ca
  IF LOWER(NEW.email) LIKE '%@solar-x.ca' THEN
    NEW.is_solar_x_email = TRUE;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-detect solar-x.ca emails
DROP TRIGGER IF EXISTS auto_detect_solar_x_email ON peak_shaving_leads;
CREATE TRIGGER auto_detect_solar_x_email
  BEFORE INSERT OR UPDATE ON peak_shaving_leads
  FOR EACH ROW
  EXECUTE FUNCTION check_solar_x_email();

-- Enable Row Level Security (RLS)
ALTER TABLE peak_shaving_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE peak_shaving_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peak_shaving_leads
-- Allow public read access to check email verification status (limited fields)
CREATE POLICY "Allow public read access to own lead data"
ON peak_shaving_leads FOR SELECT
TO public
USING (true); -- Allow reading for verification purposes (API will handle security)

-- Allow public insert for new leads
CREATE POLICY "Allow public insert for new leads"
ON peak_shaving_leads FOR INSERT
TO public
WITH CHECK (true);

-- Allow public update for verification and usage tracking (API will validate)
CREATE POLICY "Allow public update for verification"
ON peak_shaving_leads FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- RLS Policies for peak_shaving_access_logs
-- Allow public insert for access logging
CREATE POLICY "Allow public insert for access logs"
ON peak_shaving_access_logs FOR INSERT
TO public
WITH CHECK (true);

-- Allow public read access to logs (for admin purposes, API will handle filtering)
CREATE POLICY "Allow public read access to access logs"
ON peak_shaving_access_logs FOR SELECT
TO public
USING (true);

-- Admin access (if you have an admin role system)
-- Uncomment and adjust if you have admin authentication
/*
CREATE POLICY "Allow admin full access to leads"
ON peak_shaving_leads FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Allow admin full access to access logs"
ON peak_shaving_access_logs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);
*/

-- Helper function to check if email can access calculator
CREATE OR REPLACE FUNCTION can_access_calculator(check_email TEXT)
RETURNS TABLE (
  can_access BOOLEAN,
  reason TEXT,
  usage_count INTEGER,
  is_solar_x BOOLEAN,
  email_verified BOOLEAN
) AS $$
DECLARE
  lead_record peak_shaving_leads%ROWTYPE;
BEGIN
  -- Find the lead
  SELECT * INTO lead_record
  FROM peak_shaving_leads
  WHERE LOWER(email) = LOWER(check_email)
  LIMIT 1;
  
  -- If no record found, they can't access (need to verify first)
  IF lead_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Email not verified'::TEXT, 0, FALSE, FALSE;
    RETURN;
  END IF;
  
  -- Check if email is verified
  IF NOT lead_record.email_verified THEN
    RETURN QUERY SELECT FALSE, 'Email not verified'::TEXT, lead_record.usage_count, lead_record.is_solar_x_email, FALSE;
    RETURN;
  END IF;
  
  -- If it's a solar-x.ca email, unlimited access
  IF lead_record.is_solar_x_email THEN
    RETURN QUERY SELECT TRUE, 'Solar-X employee - unlimited access'::TEXT, lead_record.usage_count, TRUE, TRUE;
    RETURN;
  END IF;
  
  -- Check usage count (max 2 for regular users)
  IF lead_record.usage_count >= 2 THEN
    RETURN QUERY SELECT FALSE, 'Usage limit reached (2 uses)'::TEXT, lead_record.usage_count, FALSE, TRUE;
    RETURN;
  END IF;
  
  -- Can access
  RETURN QUERY SELECT TRUE, 'Access granted'::TEXT, lead_record.usage_count, FALSE, TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE peak_shaving_leads IS 'Stores lead email addresses and tracks verification status and usage limits for Peak Shaving Sales Calculator';
COMMENT ON TABLE peak_shaving_access_logs IS 'Logs each access to the Peak Shaving Sales Calculator for analytics and security';
COMMENT ON COLUMN peak_shaving_leads.usage_count IS 'Number of times the user has accessed the calculator (max 2 for regular users, unlimited for @solar-x.ca)';
COMMENT ON COLUMN peak_shaving_leads.is_solar_x_email IS 'TRUE if email ends with @solar-x.ca - grants unlimited access';
COMMENT ON FUNCTION can_access_calculator IS 'Checks if an email can access the calculator based on verification status and usage limits';

