-- Battery Specifications Table
-- Run this SQL in your Supabase SQL Editor to create the batteries table

CREATE TABLE IF NOT EXISTS batteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battery_id TEXT UNIQUE NOT NULL, -- Unique identifier like 'renon-16', 'tesla-powerwall', etc.
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  nominal_kwh NUMERIC(5,2) NOT NULL, -- Total battery capacity
  usable_kwh NUMERIC(5,2) NOT NULL, -- Actually usable capacity (after depth of discharge limits)
  usable_percent NUMERIC(5,2) NOT NULL, -- Percentage of nominal capacity that's usable
  round_trip_efficiency NUMERIC(4,3) NOT NULL, -- Efficiency as decimal (0.90 = 90%)
  inverter_kw NUMERIC(5,2) NOT NULL, -- Maximum continuous power output in kW
  price NUMERIC(10,2) NOT NULL, -- Price in CAD before rebates
  warranty_years INTEGER NOT NULL,
  warranty_cycles INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true, -- Allow soft deletes
  display_order INTEGER DEFAULT 0, -- For custom ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batteries_battery_id ON batteries(battery_id);
CREATE INDEX IF NOT EXISTS idx_batteries_is_active ON batteries(is_active);
CREATE INDEX IF NOT EXISTS idx_batteries_display_order ON batteries(display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batteries_updated_at BEFORE UPDATE ON batteries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial battery data (matching current static data)
INSERT INTO batteries (
  battery_id, brand, model, nominal_kwh, usable_kwh, usable_percent,
  round_trip_efficiency, inverter_kw, price, warranty_years, warranty_cycles, description, display_order
) VALUES
  ('renon-16', 'Renon', '16 kWh', 16, 14.4, 90, 0.90, 5.0, 8000, 10, 6000, 'Compact and affordable solution for basic peak shaving', 1),
  ('renon-32', 'Renon', '32 kWh', 32, 28.8, 90, 0.90, 10.0, 11000, 10, 6000, 'High capacity for maximum peak shaving potential', 2),
  ('tesla-powerwall', 'Tesla', 'Powerwall 13.5', 13.5, 12.825, 95, 0.92, 5.0, 17000, 10, 3650, 'Premium battery with industry-leading efficiency', 3),
  ('growatt-10', 'Growatt', '10 kWh', 10, 9.0, 90, 0.90, 5.0, 10000, 10, 6000, 'Entry-level battery for small homes', 4),
  ('growatt-15', 'Growatt', '15 kWh', 15, 13.5, 90, 0.90, 5.0, 13000, 10, 6000, 'Mid-sized battery for average households', 5),
  ('growatt-20', 'Growatt', '20 kWh', 20, 18.0, 90, 0.90, 5.0, 16000, 10, 6000, 'Large capacity for high-usage homes', 6)
ON CONFLICT (battery_id) DO NOTHING;

-- Add RLS (Row Level Security) policies if needed
-- For now, we'll allow public read access but restrict writes to authenticated users
ALTER TABLE batteries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to batteries"
  ON batteries FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to manage batteries (you may want to restrict this further)
CREATE POLICY "Allow authenticated users to manage batteries"
  ON batteries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

