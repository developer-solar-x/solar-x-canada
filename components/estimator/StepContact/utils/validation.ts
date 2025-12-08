import { isValidEmail, isValidPhone } from '@/lib/utils'
import type { ContactFormData } from '../types'

export function validateContactForm(formData: ContactFormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!formData.fullName.trim()) {
    errors.fullName = 'Name is required'
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email address'
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone is required'
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = 'Invalid phone number'
  }

  // Consent is optional - users can proceed without checking the box
  // if (!formData.consent) {
  //   errors.consent = 'You must agree to receive communications'
  // }

  return errors
}

