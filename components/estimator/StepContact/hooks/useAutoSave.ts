import { useEffect, RefObject } from 'react'
import { isValidEmail } from '@/lib/utils'
import type { ContactFormData } from '../types'

interface UseAutoSaveProps {
  formData: ContactFormData
  data: any
  setSaving: (saving: boolean) => void
  saveTimeoutRef: RefObject<NodeJS.Timeout | null>
}

export function useAutoSave({ formData, data, setSaving, saveTimeoutRef }: UseAutoSaveProps) {
  // Auto-save contact form data to partial leads as user types (debounced)
  useEffect(() => {
    // Only save if email is valid (required for partial leads)
    if (!formData.email || !isValidEmail(formData.email)) {
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save by 1.5 seconds after user stops typing
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        const response = await fetch('/api/partial-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            estimatorData: {
              ...data,
              // Include contact form data in estimator_data
              contactForm: {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                preferredContactTime: formData.preferredContactTime,
                preferredContactMethod: formData.preferredContactMethod,
                comments: formData.comments,
                consent: formData.consent,
              },
            },
            currentStep: 8, // Step 8 is the contact form
          }),
        })

        if (response.ok) {
          console.log('Contact form data saved to partial lead')
        } else {
          console.warn('Failed to save contact form data:', await response.text())
        }
      } catch (error) {
        console.error('Error saving contact form data:', error)
      } finally {
        setSaving(false)
      }
    }, 1500) // Wait 1.5 seconds after user stops typing

    // Cleanup timeout on unmount or when formData changes
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, data, setSaving, saveTimeoutRef])
}

