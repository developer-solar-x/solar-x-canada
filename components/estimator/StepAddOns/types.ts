export interface StepAddOnsProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface AddOn {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
}

export interface AddOnCardProps {
  addOn: AddOn
  isSelected: boolean
  onToggle: () => void
}

