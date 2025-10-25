// Estimator Progress Storage - Auto-save and Resume functionality

import { EstimatorData } from '@/app/estimator/page'

const STORAGE_KEY = 'solarx_estimator_draft'
const TIMESTAMP_KEY = 'solarx_estimator_timestamp'

/**
 * Save estimator progress to localStorage
 */
export function saveEstimatorProgress(data: EstimatorData, currentStep: number): void {
  try {
    // Create save object with metadata
    const saveData = {
      data,
      currentStep,
      timestamp: new Date().toISOString(),
      version: '1.0', // For future migrations if data structure changes
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString())
    
    console.log('✅ Progress saved:', { step: currentStep, timestamp: saveData.timestamp })
  } catch (error) {
    console.error('❌ Failed to save progress:', error)
    // Fail silently - don't break the user experience
  }
}

/**
 * Load saved estimator progress from localStorage
 */
export function loadEstimatorProgress(): {
  data: EstimatorData
  currentStep: number
  timestamp: string
} | null {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    
    if (!savedData) {
      return null
    }
    
    const parsed = JSON.parse(savedData)
    
    // Validate the saved data structure
    if (!parsed.data || typeof parsed.currentStep !== 'number') {
      console.warn('⚠️ Invalid saved data structure, clearing...')
      clearEstimatorProgress()
      return null
    }
    
    console.log('✅ Progress loaded:', { step: parsed.currentStep, timestamp: parsed.timestamp })
    return parsed
  } catch (error) {
    console.error('❌ Failed to load progress:', error)
    clearEstimatorProgress()
    return null
  }
}

/**
 * Clear saved estimator progress
 */
export function clearEstimatorProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TIMESTAMP_KEY)
    console.log('🗑️ Progress cleared')
  } catch (error) {
    console.error('❌ Failed to clear progress:', error)
  }
}

/**
 * Check if there's saved progress
 */
export function hasSavedProgress(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Get the timestamp of last save
 */
export function getLastSaveTimestamp(): Date | null {
  try {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY)
    return timestamp ? new Date(timestamp) : null
  } catch {
    return null
  }
}

/**
 * Get human-readable time since last save
 */
export function getTimeSinceLastSave(): string | null {
  const lastSave = getLastSaveTimestamp()
  
  if (!lastSave) return null
  
  const now = new Date()
  const diffMs = now.getTime() - lastSave.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

/**
 * Get saved progress summary for display
 */
export function getSavedProgressSummary(): {
  hasProgress: boolean
  step: number
  stepName: string
  timeSince: string
  address?: string
  mode?: 'easy' | 'detailed'
} | null {
  const saved = loadEstimatorProgress()
  
  if (!saved) {
    return null
  }
  
  // Determine step name based on step number and mode
  const getStepName = (step: number, mode?: 'easy' | 'detailed'): string => {
    if (step === 0) return 'Mode Selection'
    if (step === 1) return 'Location'
    
    if (mode === 'easy') {
      const stepNames = ['', 'Location', 'Roof Size', 'Photos', 'Energy', 'Details', 'Review', 'Submit']
      return stepNames[step] || `Step ${step}`
    } else {
      const stepNames = ['', 'Location', 'Draw Roof', 'Photos', 'Appliances', 'Details', 'Review', 'Submit']
      return stepNames[step] || `Step ${step}`
    }
  }
  
  return {
    hasProgress: true,
    step: saved.currentStep,
    stepName: getStepName(saved.currentStep, saved.data.estimatorMode),
    timeSince: getTimeSinceLastSave() || 'recently',
    address: saved.data.address,
    mode: saved.data.estimatorMode,
  }
}

