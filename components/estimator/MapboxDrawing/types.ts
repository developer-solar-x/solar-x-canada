export interface RoofSection {
  id: string
  azimuth: number
  area: number
  panels: number
}

export type PanelOrientation = 'landscape' | 'portrait'

export interface PanelSectionSettings {
  orientation: PanelOrientation
  rotation: number
}

/** Per-section panel layout. Key = section index (0-based). */
export type PanelSettingsBySection = Record<number, PanelSectionSettings>

export interface MapboxDrawingProps {
  coordinates: { lat: number; lng: number }
  address: string
  onAreaCalculated: (areaSqFt: number, polygon: any, mapSnapshot?: string) => void
  initialData?: any // Optional: preload existing polygons
  selectedSectionIndex?: number | null // Optional: highlight a specific section on the map
  /** Per-section panel layout. When absent or section missing, defaults to portrait + 0 rotation. */
  panelSettingsBySection?: PanelSettingsBySection
  /** Hide the roof polygon fill to see panels more clearly */
  hideRoofFill?: boolean
}
