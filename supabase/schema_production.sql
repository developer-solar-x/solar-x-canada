-- ============================================================================
-- SolarX Production Database Schema
-- ============================================================================
-- This schema includes all tables, indexes, triggers, and RLS policies
-- for the SolarX Solar Estimator application.
-- 
-- Version: 3.0 (Production)
-- Last Updated: 2025-11-06
-- 
-- Run this script in your Supabase SQL Editor to set up the production database.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ADMIN USERS TABLE
-- ============================================================================
-- Stores admin users who can access the admin panel
-- Links to Supabase Auth users table (password is managed by Supabase Auth)

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

-- Indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Enable Row Level Security for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger function to auto-update updated_at for admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin_users updated_at
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================================================
-- 2. LEADS TABLE (v3)
-- ============================================================================
-- Main table storing complete solar estimate submissions

CREATE TABLE IF NOT EXISTS leads_v3 (
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

  -- Estimator flow metadata
  estimator_mode TEXT,
  program_type TEXT,
  rate_plan TEXT,

  -- Roof information
  roof_polygon JSONB,
  roof_sections JSONB,
  roof_area_sqft NUMERIC,
  roof_type TEXT,
  roof_age TEXT,
  roof_pitch TEXT,
  shading_level TEXT,
  map_snapshot_url TEXT,

  -- Photo URLs
  photo_urls JSONB,
  photo_summary JSONB,

  -- Energy information
  monthly_bill NUMERIC,
  energy_usage JSONB,
  annual_usage_kwh NUMERIC,

  -- System selections
  system_type TEXT,
  has_battery BOOLEAN,
  selected_add_ons JSONB,

  -- Battery information
  selected_batteries JSONB,
  battery_pricing JSONB,
  battery_price NUMERIC,
  battery_rebate NUMERIC,
  battery_net_cost NUMERIC,
  battery_annual_savings NUMERIC,
  battery_monthly_savings NUMERIC,

  -- Peak shaving / rate plan data
  peak_shaving JSONB,
  tou_annual_savings NUMERIC,
  ulo_annual_savings NUMERIC,
  tou_net_cost NUMERIC,
  ulo_net_cost NUMERIC,
  tou_payback_years NUMERIC,
  ulo_payback_years NUMERIC,
  tou_profit_25y NUMERIC,
  ulo_profit_25y NUMERIC,

  -- Solar estimate data
  solar_estimate JSONB,
  system_size_kw NUMERIC,
  num_panels NUMERIC,
  solar_total_cost NUMERIC,
  solar_incentives NUMERIC,
  solar_net_cost NUMERIC,
  solar_annual_savings NUMERIC,
  solar_monthly_savings NUMERIC,
  production_annual_kwh NUMERIC,
  production_monthly_kwh JSONB,
  roi_percent NUMERIC,

  -- Combined totals (solar + battery)
  combined_totals JSONB,
  combined_total_cost NUMERIC,
  combined_net_cost NUMERIC,
  combined_monthly_savings NUMERIC,
  combined_annual_savings NUMERIC,
  combined_payback_years NUMERIC,
  combined_profit_25y NUMERIC,

  -- Financing and environmental
  financing_preference TEXT,
  env_co2_offset_tpy NUMERIC,
  env_trees_equivalent NUMERIC,
  env_cars_off_road NUMERIC,

  -- Status and CRM integration
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  hubspot_contact_id TEXT,
  hubspot_deal_id TEXT,
  hubspot_synced BOOLEAN DEFAULT false,
  hubspot_synced_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT DEFAULT 'estimator' CHECK (source IN ('estimator', 'embed', 'landing_page')),

  -- Full estimator data snapshot
  estimator_data JSONB
);

-- Indexes for leads_v3
CREATE INDEX IF NOT EXISTS idx_leads_v3_created ON leads_v3(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_v3_email ON leads_v3(email);
CREATE INDEX IF NOT EXISTS idx_leads_v3_status ON leads_v3(status);
CREATE INDEX IF NOT EXISTS idx_leads_v3_province ON leads_v3(province);
CREATE INDEX IF NOT EXISTS idx_leads_v3_hubspot_synced ON leads_v3(hubspot_synced);
CREATE INDEX IF NOT EXISTS idx_leads_v3_source ON leads_v3(source);

-- Trigger function to auto-update updated_at for leads_v3
CREATE OR REPLACE FUNCTION update_leads_v3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads_v3 updated_at
CREATE TRIGGER trigger_update_leads_v3_updated_at
  BEFORE UPDATE ON leads_v3
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_v3_updated_at();

-- Enable Row Level Security for leads_v3
ALTER TABLE leads_v3 ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public inserts (from estimator frontend)
CREATE POLICY "Allow public insert on leads_v3" ON leads_v3
  FOR INSERT
  WITH CHECK (true);

-- Note: SELECT/UPDATE/DELETE policies should be restricted to admin/service role only
-- Service role bypasses RLS by default, so no additional policies needed for admin access

-- ============================================================================
-- 3. LEAD NOTES TABLE (v3)
-- ============================================================================
-- Stores internal notes about leads

CREATE TABLE IF NOT EXISTS lead_notes_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads_v3(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  note TEXT NOT NULL
);

-- Indexes for lead_notes_v3
CREATE INDEX IF NOT EXISTS idx_lead_notes_v3_lead ON lead_notes_v3(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_v3_created_by ON lead_notes_v3(created_by);

-- Enable Row Level Security for lead_notes_v3
ALTER TABLE lead_notes_v3 ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON lead_notes_v3
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. LEAD ACTIVITIES TABLE (v3)
-- ============================================================================
-- Stores activity logs for leads (audit trail)

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

-- Indexes for lead_activities_v3
CREATE INDEX IF NOT EXISTS idx_lead_activities_v3_lead ON lead_activities_v3(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_v3_type ON lead_activities_v3(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_v3_user ON lead_activities_v3(user_id);

-- Enable Row Level Security for lead_activities_v3
ALTER TABLE lead_activities_v3 ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role full access" ON lead_activities_v3
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. PARTIAL LEADS TABLE (v3)
-- ============================================================================
-- Stores in-progress estimator sessions (draft leads)

CREATE TABLE IF NOT EXISTS partial_leads_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resumed_at TIMESTAMPTZ,

  -- Identity for lookups
  email TEXT NOT NULL,

  -- Progress state
  current_step INTEGER NOT NULL DEFAULT 0,

  -- Full estimator state snapshot
  estimator_data JSONB NOT NULL,

  -- Denormalized fields for quick filters (nullable)
  address TEXT,
  coordinates JSONB,
  rate_plan TEXT,
  roof_area_sqft NUMERIC,
  monthly_bill NUMERIC,
  annual_usage_kwh NUMERIC,
  selected_add_ons JSONB,
  photo_count INTEGER,
  photo_urls JSONB,
  map_snapshot_url TEXT
);

-- Indexes for partial_leads_v3
CREATE INDEX IF NOT EXISTS idx_partial_leads_v3_email ON partial_leads_v3(email);
CREATE INDEX IF NOT EXISTS idx_partial_leads_v3_updated ON partial_leads_v3(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_partial_leads_v3_rate_plan ON partial_leads_v3(rate_plan);
CREATE INDEX IF NOT EXISTS idx_partial_leads_v3_created ON partial_leads_v3(created_at DESC);

-- Trigger function to auto-update updated_at for partial_leads_v3
CREATE OR REPLACE FUNCTION update_partial_leads_v3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for partial_leads_v3 updated_at
CREATE TRIGGER trigger_update_partial_leads_v3_updated_at
  BEFORE UPDATE ON partial_leads_v3
  FOR EACH ROW
  EXECUTE FUNCTION update_partial_leads_v3_updated_at();

-- Enable Row Level Security for partial_leads_v3
ALTER TABLE partial_leads_v3 ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public access for draft saving/resuming
CREATE POLICY "Allow public insert partial_leads_v3" ON partial_leads_v3
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update partial_leads_v3" ON partial_leads_v3
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public select partial_leads_v3" ON partial_leads_v3
  FOR SELECT
  USING (true);

-- ============================================================================
-- 6. LANDING INTERACTIONS TABLE (v3)
-- ============================================================================
-- Stores analytics events from the landing page

CREATE TABLE IF NOT EXISTS landing_interactions_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'calculator_use',
    'cta_click',
    'video_view',
    'faq_open',
    'section_view'
  )),
  data JSONB,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Indexes for landing_interactions_v3
CREATE INDEX IF NOT EXISTS idx_landing_interactions_v3_type ON landing_interactions_v3(interaction_type);
CREATE INDEX IF NOT EXISTS idx_landing_interactions_v3_created ON landing_interactions_v3(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_interactions_v3_session ON landing_interactions_v3(session_id);

-- Enable Row Level Security for landing_interactions_v3
ALTER TABLE landing_interactions_v3 ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public inserts for analytics
CREATE POLICY "Allow public insert on landing_interactions_v3" ON landing_interactions_v3
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to cleanup old partial leads (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_partial_leads()
RETURNS void AS $$
BEGIN
  DELETE FROM partial_leads_v3
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old landing interactions (90+ days)
CREATE OR REPLACE FUNCTION cleanup_old_landing_interactions()
RETURNS void AS $$
BEGIN
  DELETE FROM landing_interactions_v3
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'SolarX Production Schema v3.0 installed successfully!' AS message;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. ADMIN USERS:
--    - Users are created via Supabase Auth (password managed by Auth)
--    - Use the /api/users endpoint to create admin users
--    - First superadmin should be created using the setup script or API
--
-- 2. ROW LEVEL SECURITY (RLS):
--    - All tables have RLS enabled
--    - Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
--    - Public policies allow inserts for leads and partial_leads
--    - Admin access uses service role, so no additional policies needed
--
-- 3. CLEANUP:
--    - Run cleanup functions periodically (via pg_cron or scheduled jobs):
--      - SELECT cleanup_old_partial_leads(); (30+ days old drafts)
--      - SELECT cleanup_old_landing_interactions(); (90+ days old analytics)
--
-- 4. INDEXES:
--    - All foreign keys and commonly queried columns are indexed
--    - Monitor query performance and add indexes as needed
--
-- 5. MIGRATION:
--    - If upgrading from v2, use the migrate_users_table.sql script first
--    - Then run this schema to create v3 tables
--    - Data migration scripts should be run separately if needed
--
-- ============================================================================

