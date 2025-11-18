export interface StepAppliancesProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface Appliance {
  id: string
  name: string
  quantity: number
  wattage: number
  hoursPerDay: number
  category: 'essential' | 'comfort' | 'future' | 'custom'
  isCustom?: boolean
}

export type ApplianceCategory = 'essential' | 'comfort' | 'future' | 'custom'

export interface ApplianceTableProps {
  appliances: Appliance[]
  category: ApplianceCategory
  title: string
  description: string
  icon: React.ReactNode
  headerColor: string
  buttonColor: string
  onUpdateAppliance: (id: string, field: keyof Appliance, value: any) => void
  onRemoveAppliance: (id: string) => void
  onAddClick: () => void
}

export interface ApplianceRowProps {
  appliance: Appliance
  onUpdate: (field: keyof Appliance, value: any) => void
  onRemove: () => void
}

export interface CustomApplianceFormProps {
  customAppliance: {
    name: string
    quantity: number
    wattage: number
    hoursPerDay: number
  }
  activeCategory: ApplianceCategory
  onCustomApplianceChange: (field: string, value: any) => void
  onAdd: () => void
  onCancel: () => void
}

export interface EnergySummaryProps {
  totalDailyKwh: number
  totalMonthlyKwh: number
  totalAnnualKwh: number
  activeApplianceCount: number
  onContinue: () => void
  onBack?: () => void
}

