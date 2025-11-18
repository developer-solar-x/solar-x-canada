export interface StepRoofSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

export interface RoofSizePreset {
  id: string
  label: string
  range: string
  sqft: number
}

export interface RoofSizePresetsProps {
  presets: RoofSizePreset[]
  selectedSize: string
  onSelectSize: (sizeId: string) => void
}

export interface CustomSizeInputProps {
  customSize: string
  onCustomSizeChange: (value: string) => void
}

export interface HelpCardProps {
  // No props needed for now, but keeping for future extensibility
}

export interface UpgradePromptProps {
  onUpgrade: () => void
}

