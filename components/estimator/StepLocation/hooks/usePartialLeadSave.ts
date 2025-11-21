import { useCallback, useState } from 'react'
import { isValidEmail } from '@/lib/utils'

export function usePartialLeadSave(email: string, data: any) {
  const [savingProgress, setSavingProgress] = useState(false)

  // Partial leads feature disabled
  // Save progress to partial leads when email is provided
  const saveProgressToPartialLead = useCallback(async (locationData: any) => {
    // Partial leads feature disabled
    return
    // if (!email || !isValidEmail(email)) return
    // 
    // try {
    //   setSavingProgress(true)
    //   const response = await fetch('/api/partial-lead', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       email,
    //       estimatorData: {
    //         ...data,
    //         ...locationData,
    //         email,
    //       },
    //       currentStep: 1, // Location step
    //     }),
    //   })
    //   
    //   if (response.ok) {
    //     console.log('Progress saved to partial lead')
    //   }
    // } catch (error) {
    //   console.error('Failed to save progress:', error)
    // } finally {
    //   setSavingProgress(false)
    // }
  }, [email, data])

  return {
    savingProgress,
    saveProgressToPartialLead,
  }
}

