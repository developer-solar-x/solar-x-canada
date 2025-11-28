import { useCallback, useState } from 'react'
import { isValidEmail } from '@/lib/utils'

// Hook to save early estimator progress into the partial_leads_v3 table
// Used from StepLocation once we have a valid email + location
export function usePartialLeadSave(email: string, data: any) {
  const [savingProgress, setSavingProgress] = useState(false)

  const saveProgressToPartialLead = useCallback(
    async (locationData: any) => {
      if (!email || !isValidEmail(email)) return

      try {
        setSavingProgress(true)

        const response = await fetch('/api/partial-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            estimatorData: {
              ...data,
              ...locationData,
              email,
            },
            currentStep: 1, // Location step
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          console.error('Failed to save partial lead:', response.status, err)
          return
        }

        const result = await response.json().catch(() => null)
        console.log('Partial lead saved/updated:', result?.id || '(no id returned)')
      } catch (error) {
        console.error('Failed to save progress:', error)
      } finally {
        setSavingProgress(false)
      }
    },
    [email, data]
  )

  return {
    savingProgress,
    saveProgressToPartialLead,
  }
}
