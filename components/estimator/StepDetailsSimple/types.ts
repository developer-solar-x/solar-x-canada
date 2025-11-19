export interface StepDetailsSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

export interface RoofTypeSelectorProps {
  roofType: string
  onRoofTypeChange: (type: string) => void
}

export interface RoofConditionSelectorProps {
  roofCondition: string
  onRoofConditionChange: (condition: string) => void
}

export interface ShadeLevelSelectorProps {
  shadeLevel: string
  onShadeLevelChange: (level: string) => void
}

export interface RoofOrientationSelectorProps {
  roofOrientation: number
  onRoofOrientationChange: (orientation: number) => void
}

export interface UpgradePromptProps {
  onUpgrade: () => void
}

export interface ProgramSelectorProps {
  programType: string
  onProgramTypeChange: (type: string) => void
}

export interface LeadTypeSelectorProps {
  leadType: string
  onLeadTypeChange: (type: string) => void
}

