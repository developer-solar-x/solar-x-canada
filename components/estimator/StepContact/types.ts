export interface StepContactProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export interface ContactFormData {
  fullName: string
  email: string
  phone: string
  preferredContactTime: string
  preferredContactMethod: string
  comments: string
  consent: boolean
}

export interface ContactFormFieldsProps {
  formData: ContactFormData
  setFormData: React.Dispatch<React.SetStateAction<ContactFormData>>
  errors: Record<string, string>
}

export interface SuccessViewProps {
  email: string
  leadId: string
}

