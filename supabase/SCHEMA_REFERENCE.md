# SolarX Database Schema Reference

Quick reference guide for the production database schema.

## Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `admin_users` | Admin user accounts | id, email, role, is_active |
| `leads_v3` | Complete lead submissions | id, email, status, estimate_data |
| `lead_notes_v3` | Internal notes on leads | id, lead_id, note, created_by |
| `lead_activities_v3` | Activity audit log | id, lead_id, activity_type, activity_data |
| `partial_leads_v3` | Draft/in-progress leads | id, email, current_step, estimator_data |
| `landing_interactions_v3` | Analytics events | id, interaction_type, data, session_id |

## Table Details

### admin_users

Admin users linked to Supabase Auth.

**Key Columns:**
- `id` (UUID, PK, FK → auth.users)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `role` (TEXT: 'superadmin', 'admin', 'sales')
- `is_active` (BOOLEAN)
- `last_login_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK → admin_users.id)

**Indexes:**
- `idx_admin_users_email`
- `idx_admin_users_role`
- `idx_admin_users_active`

### leads_v3

Complete solar estimate submissions.

**Key Columns:**
- `id` (UUID, PK)
- `full_name`, `email`, `phone` (TEXT, required)
- `address`, `province`, `coordinates` (property info)
- `status` (TEXT: 'new', 'contacted', 'qualified', 'closed')
- `system_size_kw`, `solar_annual_savings`, `combined_annual_savings` (NUMERIC)
- `peak_shaving`, `solar_estimate`, `estimator_data` (JSONB)
- `hubspot_contact_id`, `hubspot_synced` (HubSpot integration)

**Indexes:**
- `idx_leads_v3_created`
- `idx_leads_v3_email`
- `idx_leads_v3_status`
- `idx_leads_v3_province`
- `idx_leads_v3_hubspot_synced`
- `idx_leads_v3_source`

### lead_notes_v3

Internal notes on leads.

**Key Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads_v3.id)
- `note` (TEXT, required)
- `created_by` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_lead_notes_v3_lead`
- `idx_lead_notes_v3_created_by`

### lead_activities_v3

Activity audit log for leads.

**Key Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads_v3.id)
- `activity_type` (TEXT: 'status_change', 'email_sent', 'hubspot_sync', 'note_added', 'estimate_updated')
- `activity_data` (JSONB)
- `user_id` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_lead_activities_v3_lead`
- `idx_lead_activities_v3_type`
- `idx_lead_activities_v3_user`

### partial_leads_v3

Draft/in-progress estimator sessions.

**Key Columns:**
- `id` (UUID, PK)
- `email` (TEXT, required)
- `current_step` (INTEGER)
- `estimator_data` (JSONB, required)
- `address`, `coordinates`, `rate_plan` (denormalized for quick filters)
- `updated_at`, `resumed_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_partial_leads_v3_email`
- `idx_partial_leads_v3_updated`
- `idx_partial_leads_v3_rate_plan`
- `idx_partial_leads_v3_created`

### landing_interactions_v3

Analytics events from landing page.

**Key Columns:**
- `id` (UUID, PK)
- `interaction_type` (TEXT: 'calculator_use', 'cta_click', 'video_view', 'faq_open', 'section_view')
- `data` (JSONB)
- `session_id` (TEXT)
- `user_agent` (TEXT)
- `ip_address` (INET)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_landing_interactions_v3_type`
- `idx_landing_interactions_v3_created`
- `idx_landing_interactions_v3_session`

## Common Queries

### Get all leads with status
```sql
SELECT * FROM leads_v3 
WHERE status = 'new' 
ORDER BY created_at DESC;
```

### Get notes for a lead
```sql
SELECT * FROM lead_notes_v3 
WHERE lead_id = '...' 
ORDER BY created_at DESC;
```

### Get activities for a lead
```sql
SELECT * FROM lead_activities_v3 
WHERE lead_id = '...' 
ORDER BY created_at DESC;
```

### Get partial lead by email
```sql
SELECT * FROM partial_leads_v3 
WHERE email = 'user@example.com' 
ORDER BY updated_at DESC 
LIMIT 1;
```

### Get admin users by role
```sql
SELECT * FROM admin_users 
WHERE role = 'admin' AND is_active = true;
```

## Row Level Security (RLS)

All tables have RLS enabled. Access is controlled by:

1. **Service Role**: Bypasses RLS (used by API routes)
2. **Public Policies**: Allow inserts for `leads_v3` and `partial_leads_v3`
3. **Admin Access**: Uses service role, so no additional policies needed

## Triggers

- `trigger_update_admin_users_updated_at`: Auto-updates `updated_at` on `admin_users`
- `trigger_update_leads_v3_updated_at`: Auto-updates `updated_at` on `leads_v3`
- `trigger_update_partial_leads_v3_updated_at`: Auto-updates `updated_at` on `partial_leads_v3`

## Cleanup Functions

- `cleanup_old_partial_leads()`: Deletes partial leads older than 30 days
- `cleanup_old_landing_interactions()`: Deletes interactions older than 90 days

Run these periodically (via pg_cron or scheduled jobs).

## Foreign Key Relationships

```
auth.users
  └── admin_users (id)

leads_v3
  ├── lead_notes_v3 (lead_id)
  └── lead_activities_v3 (lead_id)

admin_users
  └── admin_users (created_by) [self-reference]
```

## Data Types

- **UUID**: Primary keys and foreign keys
- **TEXT**: Strings (names, emails, addresses, etc.)
- **NUMERIC**: Decimal numbers (costs, savings, sizes)
- **JSONB**: Complex nested data (estimates, peak shaving, etc.)
- **TIMESTAMPTZ**: Timestamps with timezone
- **BOOLEAN**: True/false flags
- **INTEGER**: Whole numbers (steps, counts)

## Best Practices

1. **Always use service role key** for admin operations
2. **Index foreign keys** for better query performance
3. **Use JSONB** for flexible nested data
4. **Set appropriate RLS policies** for public access
5. **Run cleanup functions** periodically
6. **Backup regularly** before major changes
7. **Test migrations** in development first

## Version History

- **v3.0** (2025-11-06): Production schema with Supabase Auth integration
- **v2.0**: Previous version with password_hash in admin_users
- **v1.0**: Initial schema

