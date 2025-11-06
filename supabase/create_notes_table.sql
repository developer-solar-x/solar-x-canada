-- Create lead_notes_v3 table for leads_v3
-- This table stores internal notes about leads

CREATE TABLE IF NOT EXISTS lead_notes_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads_v3(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  note TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lead_notes_v3_lead ON lead_notes_v3(lead_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE lead_notes_v3 ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your security requirements
-- For admin access, you may want to allow service role to access all notes
-- Example policy (adjust based on your needs):
-- CREATE POLICY "Allow service role full access" ON lead_notes_v3
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

