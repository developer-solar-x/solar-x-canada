-- Create lead_activities_v3 table for leads_v3
-- This table stores activity logs for leads

CREATE TABLE IF NOT EXISTS lead_activities_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads_v3(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'status_change',
    'email_sent',
    'hubspot_sync',
    'note_added',
    'estimate_updated'
  )),
  activity_data JSONB,
  user_id TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_activities_v3_lead ON lead_activities_v3(lead_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE lead_activities_v3 ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your security requirements
-- For admin access, you may want to allow service role to access all activities
-- Example policy (adjust based on your needs):
-- CREATE POLICY "Allow service role full access" ON lead_activities_v3
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

