# Supabase Schema Migration Guide

This guide helps you migrate from older schema versions to the production schema v3.0.

## Prerequisites

- Access to your Supabase project SQL Editor
- Backup your database before running migrations
- Test migrations in a development/staging environment first

## Migration Steps

### Step 1: Backup Your Database

Before making any changes, create a backup of your database:

1. Go to Supabase Dashboard > Database > Backups
2. Create a manual backup or ensure automatic backups are enabled

### Step 2: Migrate Admin Users Table (if needed)

If you have an existing `admin_users` table with a `password_hash` column:

1. Run the migration script:
   ```sql
   -- Run supabase/migrate_users_table.sql
   -- OR run supabase/fix_users_table_simple.sql
   ```

2. This will:
   - Remove the `password_hash` column
   - Fix foreign key constraints
   - Update the table to use Supabase Auth

### Step 3: Create Production Schema

Run the production schema script:

```sql
-- Run supabase/schema_production.sql in Supabase SQL Editor
```

This will create:
- `admin_users` (if not exists)
- `leads_v3`
- `lead_notes_v3`
- `lead_activities_v3`
- `partial_leads_v3`
- `landing_interactions_v3`

### Step 4: Migrate Data (if upgrading from v2)

If you have existing data in `leads_v2`, `lead_notes_v2`, or `lead_activities_v2`:

```sql
-- Migrate leads from v2 to v3
INSERT INTO leads_v3 (
  id, created_at, updated_at,
  full_name, email, phone, preferred_contact_time, preferred_contact_method, comments,
  address, city, province, postal_code, coordinates,
  estimator_mode, program_type, rate_plan,
  roof_polygon, roof_sections, roof_area_sqft, roof_type, roof_age, roof_pitch, shading_level, map_snapshot_url,
  photo_urls, photo_summary,
  monthly_bill, energy_usage, annual_usage_kwh,
  system_type, has_battery, selected_add_ons,
  selected_batteries, battery_pricing, battery_price, battery_rebate, battery_net_cost, battery_annual_savings, battery_monthly_savings,
  peak_shaving, tou_annual_savings, ulo_annual_savings, tou_net_cost, ulo_net_cost, tou_payback_years, ulo_payback_years, tou_profit_25y, ulo_profit_25y,
  solar_estimate, system_size_kw, num_panels, solar_total_cost, solar_incentives, solar_net_cost, solar_annual_savings, solar_monthly_savings, production_annual_kwh, production_monthly_kwh, roi_percent,
  combined_totals, combined_total_cost, combined_net_cost, combined_monthly_savings, combined_annual_savings, combined_payback_years, combined_profit_25y,
  financing_preference, env_co2_offset_tpy, env_trees_equivalent, env_cars_off_road,
  status, hubspot_contact_id, hubspot_deal_id, hubspot_synced, hubspot_synced_at,
  source, estimator_data
)
SELECT 
  id, created_at, updated_at,
  full_name, email, phone, preferred_contact_time, preferred_contact_method, comments,
  address, NULL as city, province, postal_code, coordinates,
  estimator_mode, program_type, rate_plan,
  roof_polygon, NULL as roof_sections, roof_area_sqft, roof_type, roof_age, roof_pitch, shading_level, map_snapshot_url,
  photo_urls, photo_summary,
  monthly_bill, energy_usage, annual_usage_kwh,
  system_type, has_battery, selected_add_ons,
  selected_batteries, battery_pricing, battery_price, battery_rebate, battery_net_cost, battery_annual_savings, battery_monthly_savings,
  peak_shaving, tou_annual_savings, ulo_annual_savings, tou_net_cost, ulo_net_cost, tou_payback_years, ulo_payback_years, tou_profit_25y, ulo_profit_25y,
  solar_estimate, system_size_kw, num_panels, solar_total_cost, solar_incentives, solar_net_cost, solar_annual_savings, solar_monthly_savings, production_annual_kwh, production_monthly_kwh, roi_percent,
  combined_totals, combined_total_cost, combined_net_cost, combined_monthly_savings, combined_annual_savings, combined_payback_years, combined_profit_25y,
  financing_preference, env_co2_offset_tpy, env_trees_equivalent, env_cars_off_road,
  status, hubspot_contact_id, hubspot_deal_id, hubspot_synced, hubspot_synced_at,
  source, estimator_data
FROM leads_v2
ON CONFLICT (id) DO NOTHING;

-- Migrate notes from v2 to v3
INSERT INTO lead_notes_v3 (id, lead_id, created_at, created_by, note)
SELECT id, lead_id, created_at, created_by, note
FROM lead_notes_v2
ON CONFLICT (id) DO NOTHING;

-- Migrate activities from v2 to v3
INSERT INTO lead_activities_v3 (id, lead_id, created_at, activity_type, activity_data, user_id)
SELECT id, lead_id, created_at, activity_type, activity_data, user_id
FROM lead_activities_v2
ON CONFLICT (id) DO NOTHING;

-- Migrate partial leads from v2 to v3
INSERT INTO partial_leads_v3 (
  id, created_at, updated_at, resumed_at,
  email, current_step, estimator_data,
  address, coordinates, rate_plan, roof_area_sqft, monthly_bill, annual_usage_kwh,
  selected_add_ons, photo_count, photo_urls, map_snapshot_url
)
SELECT 
  id, created_at, updated_at, resumed_at,
  email, current_step, estimator_data,
  address, coordinates, rate_plan, roof_area_sqft, monthly_bill, annual_usage_kwh,
  selected_add_ons, 
  CASE WHEN photo_urls IS NOT NULL THEN jsonb_array_length(photo_urls) ELSE 0 END as photo_count,
  photo_urls, map_snapshot_url
FROM partial_leads_v2
ON CONFLICT (id) DO NOTHING;
```

### Step 5: Verify Migration

Check that data was migrated correctly:

```sql
-- Check lead counts
SELECT 
  (SELECT COUNT(*) FROM leads_v2) as v2_count,
  (SELECT COUNT(*) FROM leads_v3) as v3_count;

-- Check notes counts
SELECT 
  (SELECT COUNT(*) FROM lead_notes_v2) as v2_count,
  (SELECT COUNT(*) FROM lead_notes_v3) as v3_count;

-- Check activities counts
SELECT 
  (SELECT COUNT(*) FROM lead_activities_v2) as v2_count,
  (SELECT COUNT(*) FROM lead_activities_v3) as v3_count;
```

### Step 6: Update Application Code

Ensure your application code is using the v3 table names:
- `leads_v3` (instead of `leads_v2` or `leads`)
- `lead_notes_v3` (instead of `lead_notes_v2` or `lead_notes`)
- `lead_activities_v3` (instead of `lead_activities_v2` or `lead_activities`)
- `partial_leads_v3` (instead of `partial_leads_v2` or `partial_leads`)

### Step 7: Test Application

1. Test lead submission
2. Test admin panel functionality
3. Test notes and activities
4. Test partial lead saving/resuming

### Step 8: Archive Old Tables (Optional)

Once you've verified everything works, you can archive or drop old tables:

```sql
-- Rename old tables (for backup)
ALTER TABLE leads_v2 RENAME TO leads_v2_archived;
ALTER TABLE lead_notes_v2 RENAME TO lead_notes_v2_archived;
ALTER TABLE lead_activities_v2 RENAME TO lead_activities_v2_archived;
ALTER TABLE partial_leads_v2 RENAME TO partial_leads_v2_archived;

-- Or drop them if you're confident (BE CAREFUL!)
-- DROP TABLE IF EXISTS leads_v2 CASCADE;
-- DROP TABLE IF EXISTS lead_notes_v2 CASCADE;
-- DROP TABLE IF EXISTS lead_activities_v2 CASCADE;
-- DROP TABLE IF EXISTS partial_leads_v2 CASCADE;
```

## Troubleshooting

### Error: "column password_hash does not exist"
- Run `supabase/migrate_users_table.sql` or `supabase/fix_users_table_simple.sql` first

### Error: "constraint violation" when migrating data
- Check for duplicate IDs or foreign key issues
- Use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` as needed

### Error: "table already exists"
- The schema uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen
- If it does, check for naming conflicts

### Missing data after migration
- Verify the SELECT queries match your v2 schema
- Check for NULL values that might cause issues
- Review the migration logs for errors

## Rollback Plan

If something goes wrong:

1. Restore from backup
2. Review error logs
3. Fix issues in a test environment
4. Retry migration

## Support

For issues or questions:
- Check the main README.md
- Review the schema_production.sql comments
- Check Supabase documentation

