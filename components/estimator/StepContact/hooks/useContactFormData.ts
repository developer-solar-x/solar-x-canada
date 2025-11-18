import { useEffect, useState } from 'react'
import type { ContactFormData } from '../types'

interface UseContactFormDataProps {
  data: any
  formData: ContactFormData
  setFormData: React.Dispatch<React.SetStateAction<ContactFormData>>
}

export function useContactFormData({ data, formData, setFormData }: UseContactFormDataProps) {
  const [dataLoaded, setDataLoaded] = useState(false)

  // Restore contact form data from saved estimator data if available
  // Also check for email from location step (data.email) which should persist
  useEffect(() => {
    // Check for email from location step (data.email) which should persist through all steps
    const emailFromData = data?.email || data?.contactForm?.email || ''
    
    // If email exists in data but not in formData, update formData
    if (emailFromData && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: emailFromData,
      }))
    }
    
    // Restore other contact form data if available (only once)
    if (!dataLoaded && data?.contactForm) {
      setFormData(prev => ({
        ...prev,
        fullName: data.contactForm.fullName || prev.fullName,
        email: emailFromData || prev.email, // Prioritize email from location step
        phone: data.contactForm.phone || prev.phone,
        preferredContactTime: data.contactForm.preferredContactTime || prev.preferredContactTime,
        preferredContactMethod: data.contactForm.preferredContactMethod || prev.preferredContactMethod,
        comments: data.contactForm.comments || prev.comments,
        consent: data.contactForm.consent || prev.consent,
      }))
      setDataLoaded(true)
    } else if (!dataLoaded) {
      // If no contactForm data but email exists from location step, pre-fill email
      if (emailFromData) {
        setFormData(prev => ({
          ...prev,
          email: emailFromData,
        }))
      }
      setDataLoaded(true)
    }
  }, [data, dataLoaded, formData.email, setFormData])
}

