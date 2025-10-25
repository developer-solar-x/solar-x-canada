-- Supabase schema for partial leads (progress saving)

-- Create partial_leads table
CREATE TABLE IF NOT EXISTS partial_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  estimator_data JSONB NOT NULL,
  current_step INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resumed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_step CHECK (current_step >= 0 AND current_step <= 7)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_partial_leads_email ON partial_leads(email);

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_partial_leads_created_at ON partial_leads(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE partial_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert
CREATE POLICY "Allow insert for all" ON partial_leads
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow select by email
CREATE POLICY "Allow select by email" ON partial_leads
  FOR SELECT
  USING (true);

-- Create policy to allow update by email
CREATE POLICY "Allow update by id" ON partial_leads
  FOR UPDATE
  USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_partial_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_partial_lead_updated_at
  BEFORE UPDATE ON partial_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_partial_lead_updated_at();

-- Optional: Create function to cleanup old drafts (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_partial_leads()
RETURNS void AS $$
BEGIN
  DELETE FROM partial_leads
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Note: To run cleanup, execute: SELECT cleanup_old_partial_leads();
-- Or set up a pg_cron job to run it automatically

