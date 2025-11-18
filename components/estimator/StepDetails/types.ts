export interface StepDetailsProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface RoofDetailsFormData {
  roofType: string
  roofAge: string
  roofPitch: string
  shadingLevel: string
  monthlyBill: string
  roofAzimuth: number
}

export interface RoofDetailsFormProps {
  formData: RoofDetailsFormData
  setFormData: React.Dispatch<React.SetStateAction<RoofDetailsFormData>>
  data: any
}

export interface EnergyUsageVerificationProps {
  formData: RoofDetailsFormData
  setFormData: React.Dispatch<React.SetStateAction<RoofDetailsFormData>>
  data: any
}

export interface RoofSummaryProps {
  data: any
}

