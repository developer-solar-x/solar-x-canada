-- HubSpot Sales KPI Dashboard - Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Table: uploads - Track file uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  row_count INTEGER,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT
);

-- Table: leads - Store processed lead data from HubSpot exports
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  owner_assigned TIMESTAMPTZ NOT NULL,
  pipeline_status TEXT NOT NULL,
  original_source TEXT,
  utm_ad TEXT,
  effective_source TEXT,
  create_date TIMESTAMPTZ,
  first_conversion_date TIMESTAMPTZ,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads table for performance
CREATE INDEX IF NOT EXISTS idx_leads_owner_week ON leads(owner, week_start);
CREATE INDEX IF NOT EXISTS idx_leads_week ON leads(week_start);
CREATE INDEX IF NOT EXISTS idx_leads_upload ON leads(upload_id);

-- Table: weekly_kpis - Store calculated KPIs per owner per week
CREATE TABLE IF NOT EXISTS weekly_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  owner TEXT NOT NULL,
  total_leads INTEGER NOT NULL,
  qualified INTEGER NOT NULL,
  proposal INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  qualified_pct NUMERIC(5,1) NOT NULL,
  proposal_pct NUMERIC(5,1) NOT NULL,
  closed_pct NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(upload_id, week_start, owner)
);

-- Index for weekly_kpis table
CREATE INDEX IF NOT EXISTS idx_weekly_kpis_week_owner ON weekly_kpis(week_start, owner);

-- Table: weekly_rollup - Store aggregated KPIs per week (all owners combined)
CREATE TABLE IF NOT EXISTS weekly_rollup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_leads INTEGER NOT NULL,
  qualified INTEGER NOT NULL,
  proposal INTEGER NOT NULL,
  closed INTEGER NOT NULL,
  qualified_pct NUMERIC(5,1) NOT NULL,
  proposal_pct NUMERIC(5,1) NOT NULL,
  closed_pct NUMERIC(5,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(upload_id, week_start)
);

-- Create storage bucket for HubSpot uploads (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hubspot-uploads', 'hubspot-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for hubspot-uploads bucket
-- Drop policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hubspot-uploads');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'hubspot-uploads');

