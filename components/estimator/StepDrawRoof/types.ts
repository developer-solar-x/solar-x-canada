export interface StepDrawRoofProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface RoofSection {
  id: string
  area: number
  panels: number
  azimuth: number
  direction: string
  efficiency: number
  confidence?: number
  confidenceReason?: string
}

export interface RoofAreaDisplayProps {
  roofArea: number
  estimatedPanels: number | null
  roofPolygon: any
}

export interface SectionBreakdownProps {
  roofSections: RoofSection[]
  roofArea: number | null
  estimatedPanels: number | null
  editingSectionIndex: number | null
  setEditingSectionIndex: (index: number | null) => void
  updateSectionOrientation: (sectionIndex: number, newAzimuth: number) => void
}

