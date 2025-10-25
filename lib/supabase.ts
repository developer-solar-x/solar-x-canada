// Supabase client configuration and helper functions

import { createClient } from '@supabase/supabase-js'

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase admin client with service role key (server-side only)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types
export interface Lead {
  id: string
  created_at: string
  updated_at: string
  
  // Contact information
  full_name: string
  email: string
  phone: string
  preferred_contact_time?: string
  preferred_contact_method?: string
  comments?: string
  
  // Property details
  address: string
  city?: string
  province: string
  postal_code?: string
  coordinates?: { lat: number; lng: number }
  
  // Roof information
  roof_polygon?: any
  roof_area_sqft?: number
  roof_type?: string
  roof_age?: string
  roof_pitch?: string
  shading_level?: string
  appliances?: string[]
  
  // Photo URLs
  photo_urls?: string[]
  
  // Energy information
  monthly_bill?: number
  annual_usage_kwh?: number
  
  // Estimate data
  estimate_data?: any
  system_size_kw?: number
  estimated_cost?: number
  net_cost_after_incentives?: number
  annual_savings?: number
  payback_years?: number
  annual_production_kwh?: number
  
  // Status tracking
  status: 'new' | 'contacted' | 'qualified' | 'closed'
  
  // HubSpot integration
  hubspot_contact_id?: string
  hubspot_deal_id?: string
  hubspot_synced: boolean
  hubspot_synced_at?: string
  
  // Source tracking
  source: 'estimator' | 'embed' | 'landing_page'
}

export interface LeadNote {
  id: string
  lead_id: string
  created_at: string
  created_by?: string
  note: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  created_at: string
  activity_type: 'status_change' | 'email_sent' | 'hubspot_sync' | 'note_added'
  activity_data?: any
  user_id?: string
}

