export const ROOF_TYPES = [
  { id: 'asphalt_shingle', label: 'Shingles', description: 'Most common' },
  { id: 'metal', label: 'Metal', description: 'Long-lasting' },
  { id: 'flat', label: 'Flat', description: 'Flat or low slope' },
  { id: 'other', label: 'Other', description: 'Not sure' },
] as const

export const ROOF_CONDITIONS = [
  { id: '0-5', label: 'New', range: '0-5 years', color: 'green' },
  { id: '6-15', label: 'Good', range: '5-15 years', color: 'blue' },
  { id: '16+', label: 'Needs Work', range: '15+ years', color: 'yellow' },
] as const

export const SHADE_LEVELS = [
  { id: 'none', label: 'No Shade', icon: '🌞', description: 'Full sun all day' },
  { id: 'minimal', label: 'Mostly Sunny', icon: '☀️', description: 'Little shade' },
  { id: 'partial', label: 'Partial Shade', icon: '⛅', description: 'Some trees nearby' },
  { id: 'significant', label: 'Heavy Shade', icon: '☁️', description: 'Lots of trees/buildings' },
] as const

