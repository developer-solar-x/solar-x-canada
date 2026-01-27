export interface RoofSection {
  id: string
  azimuth: number
  area: number
  panels: number
}

export interface MapboxDrawingProps {
  coordinates: { lat: number; lng: number }
  address: string
  onAreaCalculated: (areaSqFt: number, polygon: any, mapSnapshot?: string) => void
  initialData?: any // Optional: preload existing polygons
  selectedSectionIndex?: number | null // Optional: highlight a specific section on the map
}
