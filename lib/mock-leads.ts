// Mock leads data for admin panel (not connected to database)
// This data represents various lead scenarios with complete estimator information

// Define comprehensive lead type with all estimator fields
export interface MockLead {
  // Database fields
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
  city: string
  province: string
  postal_code?: string
  coordinates?: { lat: number; lng: number }
  
  // Estimator mode
  estimator_mode: 'easy' | 'detailed'
  rate_plan?: 'tou' | 'ulo'
  
  // Roof information
  roof_polygon?: any
  roof_area_sqft?: number
  roof_type?: string
  roof_age?: string
  roof_pitch?: string
  shading_level?: string
  roof_azimuth?: number // Roof orientation in degrees
  roof_sections?: number // Number of roof sections drawn
  
  // Photos
  photo_urls?: string[]
  photo_count?: number
  photo_summary?: { total: number; byCategory: Array<{ category: string; count: number }> }
  
  // Energy information
  monthly_bill?: number
  annual_usage_kwh?: number
  energy_usage?: { dailyKwh?: number; monthlyKwh?: number; annualKwh?: number }
  home_size?: string
  energy_entry_method?: 'simple' | 'detailed'
  
  // Add-ons selected
  selected_add_ons?: string[] // ev_charger, heat_pump, new_roof, water_heater
  
  // Estimate data
  estimate_data?: any
  system_size_kw?: number
  num_panels?: number
  estimated_cost?: number
  solar_incentives?: number
  net_cost_after_incentives?: number
  annual_savings?: number
  monthly_savings?: number
  payback_years?: number
  annual_production_kwh?: number
  roi_percent?: number
  
  // Peak‑shaving preview (new standalone + estimator alignment)
  peak_shaving?: {
    annual_usage_kwh: number
    manual_production_kwh?: number
    system_size_kw?: number
    solar_rebate?: number
    battery_id?: string
    tou?: { battery_annual: number; combined_annual: number; payback_years: number; profit_25y?: number }
    ulo?: { battery_annual: number; combined_annual: number; payback_years: number; profit_25y?: number }
  }
  // Persisted standalone inputs snapshot
  standalone_persist?: { size_kw: number; num_panels: number; annual_production_kwh: number; annual_usage_kwh: number }
  
  // Status tracking
  status: 'new' | 'contacted' | 'qualified' | 'closed'

  // Combined review totals (mirrors StepReview)
  combined?: {
    total_cost?: number
    net_cost?: number
    monthly_savings?: number
    annual_savings?: number
    payback_years?: number
    profit_25y?: number
  }

  // Environmental snapshot
  environmental?: { co2_tpy?: number; trees?: number; cars_off_road?: number }

  // Financing
  financing_preference?: 'cash' | string

  // Activity log for admin Activity tab
  activities?: Array<{
    id: string
    created_at: string
    activity_type: 'status_change' | 'email_sent' | 'hubspot_sync' | 'note_added' | 'estimate_updated'
    activity_data?: any
    user_id?: string
  }>

  // HubSpot CRM integration
  hubspot_contact_id?: string
  hubspot_deal_id?: string
  hubspot_synced: boolean
  hubspot_synced_at?: string
  
  // Source tracking
  source: 'estimator' | 'embed' | 'landing_page'
}

// Mock leads with comprehensive data from new estimator features
export const mockLeads: MockLead[] = [
  // Lead 1: Detailed mode with large system and add-ons
  {
    id: 'lead-001',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    full_name: 'Michael Thompson',
    email: 'michael.thompson@email.com',
    phone: '(416) 555-1234',
    preferred_contact_time: 'evening',
    preferred_contact_method: 'phone',
    comments: 'Interested in maximizing solar production. Planning to get an EV next year.',
    address: '145 King Street West, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5H 1J8',
    coordinates: { lat: 43.6487, lng: -79.3877 },
    estimator_mode: 'detailed',
    rate_plan: 'ulo',
    roof_polygon: { type: 'FeatureCollection', features: [] }, // Simplified for mock
    roof_area_sqft: 2800,
    roof_sections: 2,
    roof_type: 'asphalt_shingle',
    roof_age: '0-5',
    roof_pitch: 'medium',
    shading_level: 'minimal',
    roof_azimuth: 185, // South-facing
    photo_urls: [
      'https://example.com/photos/roof-1.jpg',
      'https://example.com/photos/roof-2.jpg',
      'https://example.com/photos/electrical-panel.jpg'
    ],
    photo_count: 3,
    photo_summary: { total: 3, byCategory: [{ category: 'general', count: 3 }] },
    monthly_bill: 280,
    annual_usage_kwh: 14500,
    energy_usage: { monthlyKwh: 1208, annualKwh: 14500 },
    energy_entry_method: 'detailed',
    selected_add_ons: ['ev_charger', 'battery'],
    system_size_kw: 12.8,
    num_panels: 26,
    estimated_cost: 38400,
    solar_incentives: 9600,
    net_cost_after_incentives: 28800,
    annual_savings: 3250,
    monthly_savings: 271,
    payback_years: 8.9,
    annual_production_kwh: 16000,
    roi_percent: 265,
    peak_shaving: {
      annual_usage_kwh: 14500,
      manual_production_kwh: 16000,
      system_size_kw: 12.8,
      solar_rebate: 5000,
      battery_id: 'renon-16',
      tou: { battery_annual: 420, combined_annual: 1780, payback_years: 9.8, profit_25y: 32000 },
      ulo: { battery_annual: 1240, combined_annual: 2600, payback_years: 7.6, profit_25y: 54000 }
    },
    standalone_persist: { size_kw: 12.8, num_panels: 26, annual_production_kwh: 16000, annual_usage_kwh: 14500 },
    combined: { total_cost: 38400, net_cost: 28800, monthly_savings: 271, annual_savings: 3250, payback_years: 8.9, profit_25y: 52000 },
    environmental: { co2_tpy: 4.5, trees: 108, cars_off_road: 0.9 },
    financing_preference: 'cash',
    // Full estimate snapshot for admin Estimate tab
    estimate_data: {
      costs: { totalCost: 38400, incentives: 9600, netCost: 28800 },
      savings: { annualSavings: 3250, monthlySavings: 271, paybackYears: 8.9, roi: 265 },
      production: { annualKwh: 16000, monthlyKwh: Array(12).fill(1333) },
      environmental: { co2OffsetTonsPerYear: 4.5, treesEquivalent: 108, carsOffRoadEquivalent: 0.9 },
      peakShaving: {
        ratePlan: 'ulo',
        tou: { annualCombined: 1780, paybackYears: 9.8, profit25y: 32000 },
        ulo: { annualCombined: 2600, paybackYears: 7.6, profit25y: 54000 }
      }
    },
    // Activity timeline for admin Activity tab
    activities: [
      { id: 'act-001a', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), activity_type: 'estimate_updated', activity_data: { stage: 'review' } },
      { id: 'act-001b', created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), activity_type: 'email_sent', activity_data: { template: 'estimate_summary' } },
      { id: 'act-001c', created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), activity_type: 'status_change', activity_data: { from: 'new', to: 'contacted' } }
    ],
    status: 'new',
    hubspot_synced: false,
    source: 'estimator'
  },

  // Lead 2: Easy mode with modest system
  {
    id: 'lead-002',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    full_name: 'Sarah Chen',
    email: 'sarah.chen@gmail.com',
    phone: '(647) 555-8901',
    preferred_contact_time: 'afternoon',
    preferred_contact_method: 'email',
    comments: 'Just exploring options. Want to reduce electricity costs.',
    address: '892 Bloor Street West, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M6H 1L5',
    coordinates: { lat: 43.6589, lng: -79.4291 },
    estimator_mode: 'easy',
    rate_plan: 'tou',
    roof_area_sqft: 1500,
    roof_sections: 1,
    roof_type: 'asphalt_shingle',
    roof_age: '6-10',
    roof_pitch: 'medium',
    shading_level: 'minimal',
    photo_count: 2,
    photo_summary: { total: 2, byCategory: [{ category: 'general', count: 2 }] },
    monthly_bill: 165,
    annual_usage_kwh: 8200,
    energy_usage: { monthlyKwh: 683, annualKwh: 8200 },
    home_size: '1500-2000',
    energy_entry_method: 'simple',
    selected_add_ons: [],
    system_size_kw: 7.5,
    num_panels: 15,
    estimated_cost: 22500,
    solar_incentives: 5625,
    net_cost_after_incentives: 16875,
    annual_savings: 1850,
    monthly_savings: 154,
    payback_years: 9.1,
    annual_production_kwh: 9375,
    peak_shaving: {
      annual_usage_kwh: 8200,
      manual_production_kwh: 9375,
      system_size_kw: 7.5,
      solar_rebate: 5000,
      battery_id: 'renon-16',
      tou: { battery_annual: 306, combined_annual: 1692, payback_years: 12.5, profit_25y: 21000 },
      ulo: { battery_annual: 1031, combined_annual: 2417, payback_years: 8.8, profit_25y: 41000 }
    },
    standalone_persist: { size_kw: 7.5, num_panels: 15, annual_production_kwh: 9897, annual_usage_kwh: 10009 },
    combined: { total_cost: 22500, net_cost: 16875, monthly_savings: 154, annual_savings: 1850, payback_years: 9.1, profit_25y: 29000 },
    environmental: { co2_tpy: 3.2, trees: 78, cars_off_road: 0.6 },
    financing_preference: 'cash',
    estimate_data: {
      costs: { totalCost: 22500, incentives: 5625, netCost: 16875 },
      savings: { annualSavings: 1850, monthlySavings: 154, paybackYears: 9.1, roi: 220 },
      production: { annualKwh: 9375, monthlyKwh: Array(12).fill(781) },
      environmental: { co2OffsetTonsPerYear: 3.2, treesEquivalent: 78, carsOffRoadEquivalent: 0.6 },
      peakShaving: {
        ratePlan: 'tou',
        tou: { annualCombined: 1692, paybackYears: 12.5, profit25y: 21000 },
        ulo: { annualCombined: 2417, paybackYears: 8.8, profit25y: 41000 }
      }
    },
    activities: [
      { id: 'act-002a', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), activity_type: 'estimate_updated', activity_data: { stage: 'energy' } },
      { id: 'act-002b', created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), activity_type: 'hubspot_sync', activity_data: { result: 'success' } },
      { id: 'act-002c', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), activity_type: 'status_change', activity_data: { from: 'new', to: 'contacted' } }
    ],
    status: 'contacted',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-12345',
    hubspot_deal_id: 'hs-deal-67890',
    hubspot_synced_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 3: Large home with multiple add-ons
  {
    id: 'lead-003',
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    updated_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    full_name: 'James Wilson',
    email: 'j.wilson@outlook.com',
    phone: '(905) 555-4567',
    preferred_contact_time: 'morning',
    preferred_contact_method: 'phone',
    comments: 'Looking for a complete home energy upgrade. Budget is flexible for quality installation.',
    address: '456 Forest Hill Road, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5P 2N7',
    coordinates: { lat: 43.6952, lng: -79.4165 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 3500,
    roof_sections: 3,
    roof_type: 'metal',
    roof_age: '0-5',
    roof_pitch: 'steep',
    shading_level: 'none',
    roof_azimuth: 180, // Perfect south
    photo_urls: [
      'https://example.com/photos/luxury-roof-1.jpg',
      'https://example.com/photos/luxury-roof-2.jpg',
      'https://example.com/photos/luxury-roof-3.jpg',
      'https://example.com/photos/luxury-electrical.jpg'
    ],
    photo_count: 4,
    monthly_bill: 420,
    annual_usage_kwh: 22000,
    energy_entry_method: 'detailed',
    selected_add_ons: ['ev_charger', 'heat_pump', 'water_heater', 'battery'],
    system_size_kw: 18.5,
    estimated_cost: 55500,
    net_cost_after_incentives: 41625,
    annual_savings: 4950,
    payback_years: 8.4,
    annual_production_kwh: 23125,
    status: 'qualified',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-22222',
    hubspot_deal_id: 'hs-deal-33333',
    hubspot_synced_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 4: Small condo with east-facing roof
  {
    id: 'lead-004',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Emily Rodriguez',
    email: 'emily.r@yahoo.com',
    phone: '(416) 555-7890',
    preferred_contact_time: 'anytime',
    preferred_contact_method: 'text',
    address: '789 Queen Street East, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M4M 1J1',
    coordinates: { lat: 43.6626, lng: -79.3421 },
    estimator_mode: 'easy',
    roof_area_sqft: 950,
    roof_sections: 1,
    roof_type: 'flat',
    roof_age: '6-10',
    roof_pitch: 'flat',
    shading_level: 'partial',
    roof_azimuth: 90, // East-facing
    photo_count: 1,
    monthly_bill: 125,
    annual_usage_kwh: 6000,
    home_size: 'under-1500',
    energy_entry_method: 'simple',
    selected_add_ons: ['ev_charger'],
    system_size_kw: 5.2,
    estimated_cost: 15600,
    net_cost_after_incentives: 11700,
    annual_savings: 1320,
    payback_years: 8.9,
    annual_production_kwh: 5850,
    status: 'contacted',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-44444',
    hubspot_synced_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 5: Older home needing roof replacement
  {
    id: 'lead-005',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Robert Anderson',
    email: 'robert.anderson@gmail.com',
    phone: '(647) 555-2345',
    preferred_contact_time: 'morning',
    preferred_contact_method: 'phone',
    comments: 'My roof is quite old. Want to replace it and add solar at the same time.',
    address: '234 Danforth Avenue, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M4K 1N6',
    coordinates: { lat: 43.6777, lng: -79.3541 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 2100,
    roof_sections: 2,
    roof_type: 'asphalt_shingle',
    roof_age: '20+',
    roof_pitch: 'medium',
    shading_level: 'minimal',
    roof_azimuth: 195, // South-southwest
    photo_urls: [
      'https://example.com/photos/old-roof-1.jpg',
      'https://example.com/photos/old-roof-2.jpg'
    ],
    photo_count: 2,
    monthly_bill: 210,
    annual_usage_kwh: 10500,
    energy_entry_method: 'detailed',
    selected_add_ons: ['new_roof'],
    system_size_kw: 9.2,
    estimated_cost: 27600,
    net_cost_after_incentives: 20700,
    annual_savings: 2350,
    payback_years: 8.8,
    annual_production_kwh: 11270,
    status: 'new',
    hubspot_synced: false,
    source: 'estimator'
  },

  // Lead 6: West-facing with significant shading concerns
  {
    id: 'lead-006',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Lisa Patel',
    email: 'lisa.patel@hotmail.com',
    phone: '(416) 555-9012',
    preferred_contact_time: 'evening',
    preferred_contact_method: 'email',
    comments: 'Concerned about shading from nearby trees. Is solar still viable?',
    address: '567 High Park Avenue, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M6P 2S2',
    coordinates: { lat: 43.6591, lng: -79.4656 },
    estimator_mode: 'easy',
    roof_area_sqft: 1800,
    roof_sections: 1,
    roof_type: 'asphalt_shingle',
    roof_age: '6-10',
    roof_pitch: 'medium',
    shading_level: 'significant',
    roof_azimuth: 270, // West-facing
    photo_count: 2,
    monthly_bill: 180,
    annual_usage_kwh: 9200,
    home_size: '1500-2000',
    energy_entry_method: 'simple',
    selected_add_ons: [],
    system_size_kw: 6.8,
    estimated_cost: 20400,
    net_cost_after_incentives: 15300,
    annual_savings: 1560,
    payback_years: 9.8,
    annual_production_kwh: 7140, // Lower due to shading and west orientation
    status: 'contacted',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-55555',
    hubspot_synced_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 7: Premium detailed analysis with heat pump interest
  {
    id: 'lead-007',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '(905) 555-6789',
    preferred_contact_time: 'afternoon',
    preferred_contact_method: 'phone',
    comments: 'Want to go fully electric with heat pump and EV. Need complete energy solution.',
    address: '321 Yonge Street, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5B 1R7',
    coordinates: { lat: 43.6572, lng: -79.3813 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 2650,
    roof_sections: 2,
    roof_type: 'metal',
    roof_age: '0-5',
    roof_pitch: 'medium',
    shading_level: 'none',
    roof_azimuth: 175, // South-facing
    photo_urls: [
      'https://example.com/photos/modern-roof-1.jpg',
      'https://example.com/photos/modern-roof-2.jpg',
      'https://example.com/photos/modern-electrical.jpg'
    ],
    photo_count: 3,
    monthly_bill: 325,
    annual_usage_kwh: 16800,
    energy_entry_method: 'detailed',
    selected_add_ons: ['ev_charger', 'heat_pump', 'water_heater', 'battery'],
    system_size_kw: 14.5,
    estimated_cost: 43500,
    net_cost_after_incentives: 32625,
    annual_savings: 3780,
    payback_years: 8.6,
    annual_production_kwh: 18125,
    status: 'qualified',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-66666',
    hubspot_deal_id: 'hs-deal-77777',
    hubspot_synced_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 8: Budget-conscious with minimal add-ons
  {
    id: 'lead-008',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Amanda Brooks',
    email: 'amanda.brooks@gmail.com',
    phone: '(647) 555-3456',
    preferred_contact_time: 'anytime',
    preferred_contact_method: 'text',
    comments: 'Looking for most affordable option. Want to start small.',
    address: '678 College Street, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M6G 1B4',
    coordinates: { lat: 43.6544, lng: -79.4189 },
    estimator_mode: 'easy',
    roof_area_sqft: 1200,
    roof_sections: 1,
    roof_type: 'asphalt_shingle',
    roof_age: '6-10',
    roof_pitch: 'low',
    shading_level: 'minimal',
    photo_count: 1,
    monthly_bill: 135,
    annual_usage_kwh: 6800,
    home_size: 'under-1500',
    energy_entry_method: 'simple',
    selected_add_ons: [],
    system_size_kw: 6.0,
    estimated_cost: 18000,
    net_cost_after_incentives: 13500,
    annual_savings: 1530,
    payback_years: 8.8,
    annual_production_kwh: 7500,
    status: 'new',
    hubspot_synced: false,
    source: 'estimator'
  },

  // Lead 9: Commercial property interest
  {
    id: 'lead-009',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Mark Johnson',
    email: 'mark.j@business.com',
    phone: '(416) 555-0123',
    preferred_contact_time: 'morning',
    preferred_contact_method: 'email',
    comments: 'This is for my small business location. Need commercial-grade solution.',
    address: '890 Dundas Street West, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M6J 1W3',
    coordinates: { lat: 43.6513, lng: -79.4142 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 4200,
    roof_sections: 1,
    roof_type: 'flat',
    roof_age: '0-5',
    roof_pitch: 'flat',
    shading_level: 'none',
    roof_azimuth: 180,
    photo_urls: [
      'https://example.com/photos/commercial-1.jpg',
      'https://example.com/photos/commercial-2.jpg',
      'https://example.com/photos/commercial-electrical.jpg'
    ],
    photo_count: 3,
    monthly_bill: 680,
    annual_usage_kwh: 35000,
    energy_entry_method: 'detailed',
    selected_add_ons: ['battery'],
    system_size_kw: 25.0,
    estimated_cost: 75000,
    net_cost_after_incentives: 56250,
    annual_savings: 7850,
    payback_years: 7.2,
    annual_production_kwh: 31250,
    status: 'qualified',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-77777',
    hubspot_deal_id: 'hs-deal-88888',
    hubspot_synced_at: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 10: Multi-section complex roof
  {
    id: 'lead-010',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Jennifer Martinez',
    email: 'jennifer.m@email.com',
    phone: '(905) 555-4321',
    preferred_contact_time: 'evening',
    preferred_contact_method: 'phone',
    comments: 'Complex roof with multiple angles. Want to maximize every section.',
    address: '123 Lawrence Avenue East, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M4A 1A1',
    coordinates: { lat: 43.7251, lng: -79.3231 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 3100,
    roof_sections: 4, // Complex multi-section roof
    roof_type: 'asphalt_shingle',
    roof_age: '0-5',
    roof_pitch: 'medium',
    shading_level: 'minimal',
    photo_urls: [
      'https://example.com/photos/complex-roof-1.jpg',
      'https://example.com/photos/complex-roof-2.jpg',
      'https://example.com/photos/complex-roof-3.jpg',
      'https://example.com/photos/complex-electrical.jpg'
    ],
    photo_count: 4,
    monthly_bill: 295,
    annual_usage_kwh: 15200,
    energy_entry_method: 'detailed',
    selected_add_ons: ['ev_charger', 'battery'],
    system_size_kw: 13.2,
    estimated_cost: 39600,
    net_cost_after_incentives: 29700,
    annual_savings: 3420,
    payback_years: 8.7,
    annual_production_kwh: 16500,
    status: 'contacted',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-88888',
    hubspot_synced_at: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 11: Recently closed deal
  {
    id: 'lead-011',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Thomas Brown',
    email: 'thomas.brown@email.com',
    phone: '(416) 555-7654',
    preferred_contact_time: 'afternoon',
    preferred_contact_method: 'phone',
    comments: 'Ready to move forward. When can installation start?',
    address: '456 Eglinton Avenue West, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5N 1A2',
    coordinates: { lat: 43.7007, lng: -79.4098 },
    estimator_mode: 'detailed',
    roof_polygon: { type: 'FeatureCollection', features: [] },
    roof_area_sqft: 2400,
    roof_sections: 2,
    roof_type: 'asphalt_shingle',
    roof_age: '0-5',
    roof_pitch: 'medium',
    shading_level: 'none',
    roof_azimuth: 180,
    photo_urls: [
      'https://example.com/photos/ready-roof-1.jpg',
      'https://example.com/photos/ready-roof-2.jpg',
      'https://example.com/photos/ready-electrical.jpg'
    ],
    photo_count: 3,
    monthly_bill: 245,
    annual_usage_kwh: 12600,
    energy_entry_method: 'detailed',
    selected_add_ons: ['ev_charger'],
    system_size_kw: 10.5,
    estimated_cost: 31500,
    net_cost_after_incentives: 23625,
    annual_savings: 2835,
    payback_years: 8.3,
    annual_production_kwh: 13125,
    status: 'closed',
    hubspot_synced: true,
    hubspot_contact_id: 'hs-contact-99999',
    hubspot_deal_id: 'hs-deal-99999',
    hubspot_synced_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'estimator'
  },

  // Lead 12: Townhouse with limited roof space
  {
    id: 'lead-012',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    full_name: 'Nicole Wong',
    email: 'nicole.wong@gmail.com',
    phone: '(647) 555-8765',
    preferred_contact_time: 'anytime',
    preferred_contact_method: 'email',
    comments: 'Limited roof space in townhouse. What can I fit?',
    address: '789 Bathurst Street, Toronto, ON',
    city: 'Toronto',
    province: 'ON',
    postal_code: 'M5S 2R3',
    coordinates: { lat: 43.6667, lng: -79.4104 },
    estimator_mode: 'easy',
    roof_area_sqft: 850,
    roof_sections: 1,
    roof_type: 'asphalt_shingle',
    roof_age: '6-10',
    roof_pitch: 'steep',
    shading_level: 'partial',
    photo_count: 1,
    monthly_bill: 110,
    annual_usage_kwh: 5400,
    home_size: 'under-1500',
    energy_entry_method: 'simple',
    selected_add_ons: [],
    system_size_kw: 4.5,
    estimated_cost: 13500,
    net_cost_after_incentives: 10125,
    annual_savings: 1215,
    payback_years: 8.3,
    annual_production_kwh: 5062,
    status: 'new',
    hubspot_synced: false,
    source: 'estimator'
  }
]

// Helper function to get mock leads (simulating API call)
export function getMockLeads(filters?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): { leads: MockLead[], total: number } {
  let filtered = [...mockLeads]
  
  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(lead => lead.status === filters.status)
  }
  
  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(lead =>
      lead.full_name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.address.toLowerCase().includes(searchLower) ||
      lead.city.toLowerCase().includes(searchLower)
    )
  }
  
  // Calculate pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  return {
    leads: filtered.slice(startIndex, endIndex),
    total: filtered.length
  }
}

// Helper function to get mock lead by ID
export function getMockLeadById(id: string): MockLead | undefined {
  return mockLeads.find(lead => lead.id === id)
}

// Calculate mock statistics
export function getMockLeadStats() {
  return {
    totalLeads: mockLeads.length,
    avgSystemSize: mockLeads.reduce((sum, l) => sum + (l.system_size_kw || 0), 0) / mockLeads.length,
    totalSavings: mockLeads.reduce((sum, l) => sum + (l.annual_savings || 0), 0),
    newLeads: mockLeads.filter(l => l.status === 'new').length,
    contactedLeads: mockLeads.filter(l => l.status === 'contacted').length,
    qualifiedLeads: mockLeads.filter(l => l.status === 'qualified').length,
    closedLeads: mockLeads.filter(l => l.status === 'closed').length,
    avgPaybackYears: mockLeads.reduce((sum, l) => sum + (l.payback_years || 0), 0) / mockLeads.length,
    totalProductionKwh: mockLeads.reduce((sum, l) => sum + (l.annual_production_kwh || 0), 0),
    easyModeCount: mockLeads.filter(l => l.estimator_mode === 'easy').length,
    detailedModeCount: mockLeads.filter(l => l.estimator_mode === 'detailed').length,
    withAddOnsCount: mockLeads.filter(l => l.selected_add_ons && l.selected_add_ons.length > 0).length,
    withPhotosCount: mockLeads.filter(l => l.photo_count && l.photo_count > 0).length,
    multiSectionRoofsCount: mockLeads.filter(l => l.roof_sections && l.roof_sections > 1).length,
  }
}

