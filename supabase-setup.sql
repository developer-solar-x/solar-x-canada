-- Supabase Database Setup for SolarX Solar Estimator
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table - stores all solar estimate submissions
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contact information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact_time TEXT,
  preferred_contact_method TEXT,
  comments TEXT,
  
  -- Property details
  address TEXT NOT NULL,
  city TEXT,
  province TEXT DEFAULT 'ON',
  postal_code TEXT,
  coordinates JSONB,
  
  -- Roof information
  roof_polygon JSONB,
  roof_area_sqft NUMERIC,
  roof_type TEXT,
  roof_age TEXT,
  roof_pitch TEXT,
  shading_level TEXT,
  appliances JSONB,
  
  -- Photo URLs (stored in Supabase Storage)
  photo_urls JSONB,
  
  -- Energy information
  monthly_bill NUMERIC,
  annual_usage_kwh NUMERIC,
  
  -- Estimate data (full PVWatts response and calculations)
  estimate_data JSONB,
  system_size_kw NUMERIC,
  estimated_cost NUMERIC,
  net_cost_after_incentives NUMERIC,
  annual_savings NUMERIC,
  payback_years NUMERIC,
  annual_production_kwh NUMERIC,
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  
  -- HubSpot CRM integration
  hubspot_contact_id TEXT,
  hubspot_deal_id TEXT,
  hubspot_synced BOOLEAN DEFAULT false,
  hubspot_synced_at TIMESTAMPTZ,
  
  -- Source tracking
  source TEXT DEFAULT 'estimator' CHECK (source IN ('estimator', 'embed', 'landing_page'))
);

-- Lead notes table - internal notes about leads
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  note TEXT NOT NULL
);

-- Lead activities table - activity log for leads
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'email_sent', 'hubspot_sync', 'note_added')),
  activity_data JSONB,
  user_id TEXT
);

-- Landing page interactions table - for analytics
CREATE TABLE landing_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('calculator_use', 'cta_click', 'video_view', 'faq_open', 'section_view')),
  data JSONB,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_province ON leads(province);
CREATE INDEX idx_leads_hubspot_synced ON leads(hubspot_synced);

CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id, created_at DESC);
CREATE INDEX idx_activities_lead ON lead_activities(lead_id, created_at DESC);
CREATE INDEX idx_interactions_type ON landing_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON landing_interactions(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to leads table
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_interactions ENABLE ROW LEVEL SECURITY;

-- Allow public insert on leads (for form submissions)
CREATE POLICY "Allow public insert on leads" ON leads
FOR INSERT WITH CHECK (true);

-- Allow public insert on landing_interactions (for analytics)
CREATE POLICY "Allow public insert on landing_interactions" ON landing_interactions
FOR INSERT WITH CHECK (true);

-- Note: For admin access, use the service role key which bypasses RLS
-- Or create authenticated user policies as needed

-- Storage bucket for roof photos
-- This should be created in the Supabase Storage UI:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket named "roof-photos"
-- 3. Set it to PUBLIC
-- 4. Add policy:
--    - Operation: INSERT
--    - Policy name: "Allow public uploads"
--    - Policy definition: true
-- 5. Add policy:
--    - Operation: SELECT
--    - Policy name: "Allow public reads"
--    - Policy definition: true

-- Insert sample data (optional - for testing)
-- INSERT INTO leads (full_name, email, phone, address, province, system_size_kw, estimated_cost, annual_savings)
-- VALUES 
-- ('John Doe', 'john@example.com', '(416) 555-1234', '123 Main St, Toronto, ON', 'ON', 8.5, 21250, 2160),
-- ('Jane Smith', 'jane@example.com', '(613) 555-5678', '456 Oak Ave, Ottawa, ON', 'ON', 6.2, 15500, 1680);

-- Success message
SELECT 'SolarX database setup complete! 🌞' AS message;

