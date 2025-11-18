export interface StepModeSelectorProps {
  onComplete: (data: any) => void
}

export interface ProgramCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  badgeColor?: string
  features: string[]
  buttonText: string
  buttonClassName?: string
  onClick: () => void
  disabled?: boolean
  comingSoon?: boolean
  additionalInfo?: string
}

export interface ComparisonTableProps {
  // No props needed for now, but keeping for future extensibility
}

export interface LeadTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (leadType: 'residential' | 'commercial') => void
}

export interface LeadTypeCardProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
  buttonText: string
  onClick: () => void
  disabled?: boolean
  badge?: string
  badgeColor?: string
}

export type ProgramType = 'quick' | 'hrs_residential' | 'net_metering' | 'commercial'
export type EstimatorMode = 'easy' | 'detailed' | 'commercial'
export type LeadType = 'residential' | 'commercial'

export interface SelectedProgram {
  mode: EstimatorMode
  programType: ProgramType
}

