/**
 * Types for the interactive Panel Editor
 */

export interface PanelData {
  id: string
  x: number // Canvas X position
  y: number // Canvas Y position
  width: number // Panel width in pixels
  height: number // Panel height in pixels
  rotation: number // Rotation in degrees
  sectionId: string
  isSelected?: boolean
}

export interface PanelEditorState {
  panels: PanelData[]
  selectedIds: string[]
  formation: PanelFormation
  orientation: PanelOrientation
  spacing: number // Gap between panels in pixels
  snapToGrid: boolean
  gridSize: number // Snap grid size in pixels
}

export type PanelFormation =
  | 'grid'
  | 'staggered'
  | 'diagonal'
  | 'custom'

export type PanelOrientation = 'portrait' | 'landscape'

export interface PanelEditorProps {
  width: number
  height: number
  roofPolygonPixels: number[][] // Roof polygon in canvas coordinates
  initialPanels?: PanelData[]
  onPanelsChange?: (panels: PanelData[]) => void
  onPanelCountChange?: (count: number) => void
  sectionId?: string
  sectionAzimuth?: number
}

export interface FormationConfig {
  formation: PanelFormation
  orientation: PanelOrientation
  spacing: number
  rotation: number
}

// Coordinate conversion helpers
export interface CoordinateConverter {
  lngLatToPixel: (lng: number, lat: number) => { x: number; y: number }
  pixelToLngLat: (x: number, y: number) => { lng: number; lat: number }
  metersToPixels: (meters: number) => number
}
