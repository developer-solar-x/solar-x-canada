import type { PhotoCategory } from './types'

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    id: 'roof',
    name: 'Roof Photos',
    description: 'Multiple angles of your roof, including close-ups of shingles/material',
    required: true,
    maxPhotos: 5,
  },
  {
    id: 'electrical',
    name: 'Electrical Panel',
    description: 'Main electrical distribution box (open panel door to show breakers)',
    required: true,
    maxPhotos: 2,
  },
  {
    id: 'meter',
    name: 'Electric Meter',
    description: 'Your utility meter location and current reading',
    required: false,
    maxPhotos: 2,
  },
  {
    id: 'attic',
    name: 'Attic Access',
    description: 'Access point to attic/crawl space (for wiring)',
    required: false,
    maxPhotos: 2,
  },
  {
    id: 'obstructions',
    name: 'Obstructions',
    description: 'Chimneys, vents, skylights, or other roof features',
    required: false,
    maxPhotos: 3,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Any other relevant photos',
    required: false,
    maxPhotos: 3,
  },
]

