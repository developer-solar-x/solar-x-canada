-- New Supabase schema capturing the latest estimator data end-to-end
-- Each line includes a short, plain-English note for easier reading

-- Turn on the UUID helper so we can make nice unique ids
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- ensures uuid functions exist

-- Main table where full submissions live
CREATE TABLE IF NOT EXISTS leads_v2 ( -- stores a single customer's submission
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- unique id for this lead
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- when the record was made
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- when the record last changed

  -- Who we should contact
  full_name TEXT NOT NULL, -- customer's name
  email TEXT NOT NULL, -- customer's email
  phone TEXT NOT NULL, -- customer's phone
  preferred_contact_time TEXT, -- morning/afternoon/evening/anytime
  preferred_contact_method TEXT, -- phone/email/text
  comments TEXT, -- free-form notes from the customer

  -- Where the property is
  address TEXT NOT NULL, -- full address text
  province TEXT DEFAULT 'ON', -- province for quick filters
  postal_code TEXT, -- postal code if available
  coordinates JSONB, -- lat/lng stored simply as json

  -- Quick meta about the flow the customer used
  estimator_mode TEXT, -- easy or detailed
  program_type TEXT, -- selected program (e.g., HRS)
  rate_plan TEXT, -- selected rate plan id (e.g., tou or ulo)

  -- Roof details captured along the way
  roof_polygon JSONB, -- the drawn roof shape
  roof_sections JSONB, -- per-section direction/efficiency/area
  roof_area_sqft NUMERIC, -- total roof size
  roof_type TEXT, -- material type
  roof_age TEXT, -- age as entered
  roof_pitch TEXT, -- pitch value
  shading_level TEXT, -- shading level
  map_snapshot_url TEXT, -- small image shown in review

  -- Photos uploaded during the flow
  photo_urls JSONB, -- list of uploaded photo urls
  photo_summary JSONB, -- counts by category etc.

  -- Energy basics captured early
  monthly_bill NUMERIC, -- monthly bill in dollars
  energy_usage JSONB, -- daily/monthly/annual kwh
  annual_usage_kwh NUMERIC, -- explicit annual usage for filters

  -- Selections for system and add-ons
  system_type TEXT, -- grid_tied or battery_system
  has_battery BOOLEAN, -- quick check flag
  selected_add_ons JSONB, -- chosen extras

  -- Battery choices and pricing details
  selected_batteries JSONB, -- list of chosen batteries (id, brand, model, kwh)
  battery_pricing JSONB, -- price, rebates, net cost details
  battery_price NUMERIC, -- explicit battery price
  battery_rebate NUMERIC, -- explicit battery rebate amount
  battery_net_cost NUMERIC, -- explicit battery net after rebate
  battery_annual_savings NUMERIC, -- first-year battery savings
  battery_monthly_savings NUMERIC, -- first-monthly battery savings

  -- Peak shaving inputs and results (TOU/ULO)
  peak_shaving JSONB, -- full step results and comparisons
  tou_annual_savings NUMERIC, -- TOU annual savings combined with solar
  ulo_annual_savings NUMERIC, -- ULO annual savings combined with solar
  tou_net_cost NUMERIC, -- combined net investment under TOU
  ulo_net_cost NUMERIC, -- combined net investment under ULO
  tou_payback_years NUMERIC, -- payback years under TOU
  ulo_payback_years NUMERIC, -- payback years under ULO
  tou_profit_25y NUMERIC, -- 25-year profit under TOU
  ulo_profit_25y NUMERIC, -- 25-year profit under ULO

  -- Solar estimate snapshot (PV + high-level results)
  solar_estimate JSONB, -- raw estimate object
  system_size_kw NUMERIC, -- recommended system size
  num_panels NUMERIC, -- panel count estimate
  solar_total_cost NUMERIC, -- solar cost before rebates
  solar_incentives NUMERIC, -- solar rebates amount
  solar_net_cost NUMERIC, -- solar net after rebates
  solar_annual_savings NUMERIC, -- first-year solar-only savings
  solar_monthly_savings NUMERIC, -- month savings solar-only
  production_annual_kwh NUMERIC, -- yearly production
  production_monthly_kwh JSONB, -- 12-month breakdown
  roi_percent NUMERIC, -- displayed ROI

  -- Clear totals shown in review for quick reporting
  combined_totals JSONB, -- total_cost, net_cost, monthly/annual savings, payback, profit_25y
  combined_total_cost NUMERIC, -- solar + battery cost shown
  combined_net_cost NUMERIC, -- net investment after rebates
  combined_monthly_savings NUMERIC, -- per month combined
  combined_annual_savings NUMERIC, -- per year combined
  combined_payback_years NUMERIC, -- payback years shown
  combined_profit_25y NUMERIC, -- 25-year profit shown

  -- Financing preference tracked from review
  financing_preference TEXT, -- cash or a loan option id

  -- Environmental impact snapshot
  env_co2_offset_tpy NUMERIC, -- tons per year CO2 offset
  env_trees_equivalent NUMERIC, -- trees equivalent
  env_cars_off_road NUMERIC, -- cars off-road equivalent

  -- CRM + status handling
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')), -- pipeline stage
  hubspot_contact_id TEXT, -- id after sync
  hubspot_deal_id TEXT, -- deal id after sync
  hubspot_synced BOOLEAN DEFAULT false, -- quick flag
  hubspot_synced_at TIMESTAMPTZ, -- when we synced

  -- For flexibility, keep a copy of the full estimator payload
  estimator_data JSONB -- raw blob in case we add fields later
);

-- Helpful lookups for performance
CREATE INDEX IF NOT EXISTS idx_leads_v2_created ON leads_v2(created_at DESC); -- sort by newest first
CREATE INDEX IF NOT EXISTS idx_leads_v2_email ON leads_v2(email); -- search by email fast
CREATE INDEX IF NOT EXISTS idx_leads_v2_status ON leads_v2(status); -- filter by status fast
CREATE INDEX IF NOT EXISTS idx_leads_v2_province ON leads_v2(province); -- region reports fast

-- Keep updated_at fresh automatically
CREATE OR REPLACE FUNCTION update_updated_at_v2() -- updates the timestamp automatically
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW(); -- stamp when the row changes
  RETURN NEW; -- hand back the changed row
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_leads_v2_updated_at -- connect the helper to the table
BEFORE UPDATE ON leads_v2
FOR EACH ROW EXECUTE FUNCTION update_updated_at_v2(); -- run before every update

-- Security: turn on row-level rules
ALTER TABLE leads_v2 ENABLE ROW LEVEL SECURITY; -- activate per-row rules

-- Allow public inserts from the estimator front-end
CREATE POLICY "Allow public insert on leads_v2" ON leads_v2 -- let anyone add a record
FOR INSERT WITH CHECK (true); -- simple yes rule for inserts

-- Optional: allow reads by service role only (default RLS denies public selects)
-- You can add a SELECT policy later if needed for a portal

-- Notes table for internal comments on a lead (new v2)
CREATE TABLE IF NOT EXISTS lead_notes_v2 ( -- small helper table
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- unique note id
  lead_id UUID NOT NULL REFERENCES leads_v2(id) ON DELETE CASCADE, -- links to a lead
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- when the note was made
  created_by TEXT, -- who wrote the note
  note TEXT NOT NULL -- the note text
);

-- Allow inserting notes from secure back office only (no public policy here)
ALTER TABLE lead_notes_v2 ENABLE ROW LEVEL SECURITY; -- protect notes by default

-- Activities table for auditing events around a lead (new v2)
CREATE TABLE IF NOT EXISTS lead_activities_v2 ( -- history of actions
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- unique activity id
  lead_id UUID NOT NULL REFERENCES leads_v2(id) ON DELETE CASCADE, -- which lead this belongs to
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- when it happened
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change','email_sent','hubspot_sync','note_added','estimate_updated')), -- what happened
  activity_data JSONB, -- the details of the event
  user_id TEXT -- who did it (optional)
);

ALTER TABLE lead_activities_v2 ENABLE ROW LEVEL SECURITY; -- keep history private by default

-- Analytics table for lightweight events (unchanged concept, v2 name)
CREATE TABLE IF NOT EXISTS landing_interactions_v2 ( -- anonymous usage data
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- unique event id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- when it happened
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('calculator_use','cta_click','video_view','faq_open','section_view')), -- what was done
  data JSONB, -- details of the event
  session_id TEXT, -- browser session id
  user_agent TEXT, -- browser info
  ip_address INET -- visitor ip
);

ALTER TABLE landing_interactions_v2 ENABLE ROW LEVEL SECURITY; -- protect by default

-- Allow public logging of simple analytics events
CREATE POLICY "Allow public insert on landing_interactions_v2" ON landing_interactions_v2 -- let frontend log events
FOR INSERT WITH CHECK (true); -- allow writing only

-- Final friendly message so you know it ran fine
SELECT 'SolarX v2 schema installed' AS message; -- success note for the console


