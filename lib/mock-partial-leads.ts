// Mock partial leads data - users who saved progress but didn't complete submission
// These represent in-progress estimator sessions

export interface MockPartialLead {
  id: string
  email: string
  created_at: string
  updated_at: string
  resumed_at: string | null
  current_step: number
  estimator_data: {
    estimatorMode?: 'easy' | 'detailed'
    address?: string
    city?: string
    province?: string
    coordinates?: { lat: number; lng: number }
    roofAreaSqft?: number
    roofPolygon?: any
    roofType?: string
    roofAge?: string
    roofPitch?: string
    shadingLevel?: string
    monthlyBill?: number
    annualUsageKwh?: number
    homeSize?: string
    selectedAddOns?: string[]
    photoCount?: number
  }
}

// Mock partial leads with various stages of completion
export const mockPartialLeads: MockPartialLead[] = [
  // Very recent - just entered address
  {
    id: 'partial-001',
    email: 'john.starter@email.com',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 1,
    estimator_data: {
      estimatorMode: 'easy',
      address: '123 Main Street, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6532, lng: -79.3832 }
    }
  },

  // Abandoned at roof drawing step
  {
    id: 'partial-002',
    email: 'sarah.incomplete@gmail.com',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 2,
    estimator_data: {
      estimatorMode: 'detailed',
      address: '456 Oak Avenue, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6595, lng: -79.4289 },
      roofAreaSqft: 1850
    }
  },

  // Got to energy step, has most data
  {
    id: 'partial-003',
    email: 'mike.almostdone@yahoo.com',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 3,
    estimator_data: {
      estimatorMode: 'easy',
      address: '789 Elm Street, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6701, lng: -79.4011 },
      roofAreaSqft: 2100,
      roofType: 'asphalt_shingle',
      homeSize: '1500-2000',
      monthlyBill: 180,
      annualUsageKwh: 9000
    }
  },

  // Almost complete - at review step
  {
    id: 'partial-004',
    email: 'jessica.reviewing@hotmail.com',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Updated 1 hour ago
    resumed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    current_step: 6,
    estimator_data: {
      estimatorMode: 'detailed',
      address: '234 Pine Road, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6850, lng: -79.4350 },
      roofAreaSqft: 2400,
      roofType: 'metal',
      roofAge: '0-5',
      roofPitch: 'medium',
      shadingLevel: 'minimal',
      monthlyBill: 220,
      annualUsageKwh: 11000,
      selectedAddOns: ['ev_charger', 'battery'],
      photoCount: 3
    }
  },

  // Old lead - 2 days ago, never resumed
  {
    id: 'partial-005',
    email: 'abandoned.user@email.com',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 1,
    estimator_data: {
      estimatorMode: 'easy',
      address: '567 Maple Drive, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6442, lng: -79.4009 }
    }
  },

  // Medium completion - got through property details
  {
    id: 'partial-006',
    email: 'alex.partial@gmail.com',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 4,
    estimator_data: {
      estimatorMode: 'detailed',
      address: '890 Cedar Lane, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.7001, lng: -79.4156 },
      roofAreaSqft: 1650,
      roofType: 'asphalt_shingle',
      roofAge: '6-10',
      roofPitch: 'medium',
      shadingLevel: 'partial',
      monthlyBill: 165,
      annualUsageKwh: 8200
    }
  },

  // Recent but minimal data
  {
    id: 'partial-007',
    email: 'quick.look@outlook.com',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 2,
    estimator_data: {
      estimatorMode: 'easy',
      address: '321 Birch Avenue, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6789, lng: -79.3567 },
      roofAreaSqft: 1400,
      homeSize: 'under-1500'
    }
  },

  // Old but detailed - good follow-up candidate
  {
    id: 'partial-008',
    email: 'detail.seeker@email.com',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 5,
    estimator_data: {
      estimatorMode: 'detailed',
      address: '654 Willow Street, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6623, lng: -79.3845 },
      roofAreaSqft: 2800,
      roofType: 'metal',
      roofAge: '0-5',
      roofPitch: 'steep',
      shadingLevel: 'none',
      monthlyBill: 280,
      annualUsageKwh: 14000,
      selectedAddOns: ['ev_charger', 'heat_pump', 'battery'],
      photoCount: 4
    }
  },

  // Very recent - just saved at energy step
  {
    id: 'partial-009',
    email: 'energy.checker@gmail.com',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 3,
    estimator_data: {
      estimatorMode: 'easy',
      address: '987 Spruce Court, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6901, lng: -79.4234 },
      roofAreaSqft: 1950,
      homeSize: '1500-2000',
      monthlyBill: 195
    }
  },

  // Week old - cold lead
  {
    id: 'partial-010',
    email: 'old.inquiry@yahoo.com',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    resumed_at: null,
    current_step: 1,
    estimator_data: {
      estimatorMode: 'easy',
      address: '147 Ash Boulevard, Toronto, ON',
      city: 'Toronto',
      province: 'ON',
      coordinates: { lat: 43.6445, lng: -79.3998 }
    }
  }
]

// Helper function to get mock partial leads with filtering
export function getMockPartialLeads(filters?: {
  search?: string
  ageFilter?: 'recent' | 'today' | 'week' | 'all'
  completionFilter?: 'high' | 'medium' | 'low' | 'all'
}): { partialLeads: MockPartialLead[], total: number } {
  let filtered = [...mockPartialLeads]
  
  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(lead =>
      lead.email.toLowerCase().includes(searchLower) ||
      lead.estimator_data.address?.toLowerCase().includes(searchLower) ||
      lead.estimator_data.city?.toLowerCase().includes(searchLower)
    )
  }
  
  // Apply age filter
  if (filters?.ageFilter && filters.ageFilter !== 'all') {
    const now = Date.now()
    filtered = filtered.filter(lead => {
      const createdTime = new Date(lead.created_at).getTime()
      const ageHours = (now - createdTime) / (1000 * 60 * 60)
      
      switch (filters.ageFilter) {
        case 'recent':
          return ageHours <= 2 // Last 2 hours
        case 'today':
          return ageHours <= 24 // Last 24 hours
        case 'week':
          return ageHours <= 168 // Last 7 days
        default:
          return true
      }
    })
  }
  
  // Apply completion filter
  if (filters?.completionFilter && filters.completionFilter !== 'all') {
    filtered = filtered.filter(lead => {
      const totalSteps = lead.estimator_data.estimatorMode === 'easy' ? 8 : 7
      const completion = (lead.current_step / totalSteps) * 100
      
      switch (filters.completionFilter) {
        case 'high':
          return completion >= 70 // 70%+ complete
        case 'medium':
          return completion >= 40 && completion < 70 // 40-70% complete
        case 'low':
          return completion < 40 // Less than 40% complete
        default:
          return true
      }
    })
  }
  
  return {
    partialLeads: filtered,
    total: filtered.length
  }
}

// Get partial lead by ID
export function getMockPartialLeadById(id: string): MockPartialLead | undefined {
  return mockPartialLeads.find(lead => lead.id === id)
}

// Calculate stats
export function getMockPartialLeadStats() {
  const now = Date.now()
  
  const recentLeads = mockPartialLeads.filter(lead => {
    const ageHours = (now - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)
    return ageHours <= 24
  })
  
  const resumedLeads = mockPartialLeads.filter(lead => lead.resumed_at !== null)
  
  const highCompletionLeads = mockPartialLeads.filter(lead => {
    const totalSteps = lead.estimator_data.estimatorMode === 'easy' ? 8 : 7
    const completion = (lead.current_step / totalSteps) * 100
    return completion >= 70
  })
  
  return {
    total: mockPartialLeads.length,
    recentCount: recentLeads.length,
    resumedCount: resumedLeads.length,
    highCompletionCount: highCompletionLeads.length,
    avgCompletion: mockPartialLeads.reduce((sum, lead) => {
      const totalSteps = lead.estimator_data.estimatorMode === 'easy' ? 8 : 7
      return sum + (lead.current_step / totalSteps) * 100
    }, 0) / mockPartialLeads.length
  }
}

