import type { RoofSizePreset } from './types'

export const ROOF_SIZE_PRESETS: RoofSizePreset[] = [
  { id: 'small', label: 'Small', range: '< 1,000 sq ft', sqft: 800 },
  { id: 'medium', label: 'Medium', range: '1,000 - 2,000 sq ft', sqft: 1500 },
  { id: 'large', label: 'Large', range: '2,000 - 3,000 sq ft', sqft: 2500 },
  { id: 'xlarge', label: 'Very Large', range: '> 3,000 sq ft', sqft: 3500 },
]

