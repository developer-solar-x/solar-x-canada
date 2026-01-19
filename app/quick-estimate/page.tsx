'use client'

// 8-Step Quick Estimate Flow (based on estimator easy mode)
// Step 1: Location
// Step 2: Roof Size
// Step 3: Energy
// Step 4: Battery Savings (optional)
// Step 5: Add-ons
// Step 6: Photos
// Step 7: Details
// Step 8: Review
// Step 9: Submit

import { useState, useEffect, Suspense, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { X, Check, Save, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import {
  trackEstimateStarted,
  trackEstimateStep,
  trackEstimateStepComplete,
  trackEstimateStepBack,
  trackEstimateAbandoned,
  trackEstimateCompleted,
} from '@/lib/posthog'
import { StepLocation } from '@/components/estimator/StepLocation'
import { StepRoofSimple } from '@/components/estimator/StepRoofSimple'
import { StepEnergySimple } from '@/components/estimator/StepEnergySimple'
import { StepBatteryPeakShavingFRD as StepBatteryPeakShaving } from '@/components/estimator/StepBatteryPeakShavingFRD'
import { StepNetMetering } from '@/components/estimator/StepNetMetering'
import { StepAddOns } from '@/components/estimator/StepAddOns'
import { StepPhotosSimple } from '@/components/estimator/StepPhotosSimple'
import { StepDetailsSimple } from '@/components/estimator/StepDetailsSimple'
import { StepReview } from '@/components/estimator/StepReview'
import { StepContact } from '@/components/estimator/StepContact'

// Quick Estimate data type (based on EstimatorData)
export interface QuickEstimateData {
  // Program selection (from query params)
  programType?: 'net_metering' | 'hrs_residential' | 'quick'
  leadType?: 'residential' | 'commercial'
  hasBattery?: boolean
  systemType?: 'battery_system' | 'grid_tied'
  
  // Step 1: Location
  address?: string
  coordinates?: { lat: number; lng: number }
  city?: string
  province?: string
  email?: string
  
  // Step 2: Roof
  roofAreaSqft?: number
  roofSizePreset?: string
  roofEntryMethod?: 'preset' | 'manual' | 'drawn'
  
  // Step 3: Energy
  energyEntryMethod?: 'simple' | 'detailed'
  energyUsage?: {
    dailyKwh: number
    monthlyKwh: number
    annualKwh: number
  }
  annualUsageKwh?: number
  monthlyBill?: number
  homeSize?: string
  specialAppliances?: string[]
  
  // Step 4: Battery Savings (optional)
  selectedBattery?: string
  batteryDetails?: any
  peakShaving?: {
    ratePlan: string
    annualUsageKwh: number
    selectedBattery: string
    comparisons: any[]
  }
  
  // Step 5: Add-ons
  selectedAddOns?: string[]
  
  // Step 6: Photos
  photos?: any[]
  photoSummary?: any
  
  // Step 7: Details
  roofType?: string
  roofAge?: string
  roofPitch?: string
  shadingLevel?: string
  roofAzimuth?: number
  
  // Step 8: Review & Estimate
  estimate?: any
  financingOption?: string
}

// Step definitions (8 steps matching estimator easy mode)
const steps = [
  { id: 0, name: 'Location', component: StepLocation },
  { id: 1, name: 'Roof Size', component: StepRoofSimple },
  { id: 2, name: 'Energy', component: StepEnergySimple },
  { id: 3, name: 'Battery Savings', component: StepBatteryPeakShaving, optional: true },
  { id: 3, name: 'Net Metering Savings', component: StepNetMetering, optional: true },
  { id: 4, name: 'Add-ons', component: StepAddOns },
  { id: 5, name: 'Photos', component: StepPhotosSimple },
  { id: 6, name: 'Details', component: StepDetailsSimple },
  { id: 7, name: 'Review', component: StepReview },
  { id: 8, name: 'Submit', component: StepContact },
]

// Local storage key for progress
const STORAGE_KEY = 'quick-estimate-progress'

// Sanitize data for localStorage - exclude large fields that can exceed quota
// Similar to estimator-storage.ts approach - only save essential fields
function sanitizeDataForStorage(data: QuickEstimateData): QuickEstimateData {
  // Create a new object with only essential fields (don't copy everything)
  const sanitized: QuickEstimateData = {}
  
  // Program selection
  if (data.programType) sanitized.programType = data.programType
  if (data.leadType) sanitized.leadType = data.leadType
  if (data.hasBattery !== undefined) sanitized.hasBattery = data.hasBattery
  if (data.systemType) sanitized.systemType = data.systemType
  
  // Location
  if (data.address) sanitized.address = data.address
  if (data.coordinates) sanitized.coordinates = data.coordinates
  if (data.city) sanitized.city = data.city
  if (data.province) sanitized.province = data.province
  if (data.email) sanitized.email = data.email
  
  // Roof
  if (data.roofAreaSqft !== undefined) sanitized.roofAreaSqft = data.roofAreaSqft
  if (data.roofSizePreset) sanitized.roofSizePreset = data.roofSizePreset
  if (data.roofEntryMethod) sanitized.roofEntryMethod = data.roofEntryMethod
  
  // Energy
  if (data.energyEntryMethod) sanitized.energyEntryMethod = data.energyEntryMethod
  if (data.energyUsage) sanitized.energyUsage = data.energyUsage
  if (data.annualUsageKwh !== undefined) sanitized.annualUsageKwh = data.annualUsageKwh
  if (data.monthlyBill !== undefined) sanitized.monthlyBill = data.monthlyBill
  if (data.homeSize) sanitized.homeSize = data.homeSize
  if (data.specialAppliances) sanitized.specialAppliances = data.specialAppliances
  
  // Battery (only selected ID, not full details)
  if (data.selectedBattery) sanitized.selectedBattery = data.selectedBattery
  // Exclude batteryDetails and peakShaving.comparisons (too large)
  
  // Add-ons
  if (data.selectedAddOns) sanitized.selectedAddOns = data.selectedAddOns
  
  // Details
  if (data.roofType) sanitized.roofType = data.roofType
  if (data.roofAge) sanitized.roofAge = data.roofAge
  if (data.roofPitch) sanitized.roofPitch = data.roofPitch
  if (data.shadingLevel) sanitized.shadingLevel = data.shadingLevel
  if (data.roofAzimuth !== undefined) sanitized.roofAzimuth = data.roofAzimuth
  
  // Financing
  if (data.financingOption) sanitized.financingOption = data.financingOption
  
  // Explicitly exclude large fields:
  // - photos (base64 images are very large)
  // - photoSummary
  // - estimate (large calculation results)
  // - batteryDetails (full battery specs)
  // - peakShaving (large comparison arrays)
  
  return sanitized
}

function saveProgress(data: QuickEstimateData, step: number) {
  try {
    // Sanitize data to exclude large fields before saving
    const sanitizedData = sanitizeDataForStorage(data)
    
    const progressData = {
      data: sanitizedData,
      currentStep: step,
      savedAt: new Date().toISOString(),
    }
    
    const serialized = JSON.stringify(progressData)
    
    // Check size before saving (localStorage typically has 5-10MB limit)
    // Warn if approaching limit (4MB threshold)
    if (serialized.length > 4 * 1024 * 1024) {
      console.warn('Progress data is large, some fields may be excluded:', serialized.length, 'bytes')
    }
    
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // If still too large, try saving even less data
      console.warn('Storage quota exceeded, saving minimal data only')
      try {
        const minimalData: QuickEstimateData = {
          province: data.province,
          programType: data.programType,
          leadType: data.leadType,
          hasBattery: data.hasBattery,
          systemType: data.systemType,
          address: data.address,
          coordinates: data.coordinates,
          city: data.city,
          email: data.email,
          roofAreaSqft: data.roofAreaSqft,
          roofSizePreset: data.roofSizePreset,
          roofEntryMethod: data.roofEntryMethod,
          energyEntryMethod: data.energyEntryMethod,
          annualUsageKwh: data.annualUsageKwh,
          monthlyBill: data.monthlyBill,
          homeSize: data.homeSize,
          selectedBattery: data.selectedBattery,
          selectedAddOns: data.selectedAddOns,
          roofType: data.roofType,
          roofAge: data.roofAge,
          roofPitch: data.roofPitch,
          shadingLevel: data.shadingLevel,
          roofAzimuth: data.roofAzimuth,
          financingOption: data.financingOption,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: minimalData,
          currentStep: step,
          savedAt: new Date().toISOString(),
        }))
      } catch (e2) {
        console.error('Failed to save even minimal progress:', e2)
      }
    } else {
      console.error('Failed to save progress:', e)
    }
  }
}

function loadProgress(): { data: QuickEstimateData; currentStep: number; savedAt: string } | null {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load progress:', e)
  }
  return null
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear progress:', e)
  }
}

function getTimeSinceLastSave(): string {
  // Only access localStorage on client side
  if (typeof window === 'undefined') return ''
  const saved = loadProgress()
  if (!saved?.savedAt) return ''

  const savedDate = new Date(saved.savedAt)
  const now = new Date()
  const diffMs = now.getTime() - savedDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'just now'
}

function QuickEstimateContent() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<QuickEstimateData>({})
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Track estimate start time for analytics
  const estimateStartTime = useRef<number>(Date.now())
  const hasTrackedStart = useRef<boolean>(false)

  // Filter steps based on programType (similar to estimator)
  // This needs to be recalculated when data changes, so we'll compute it in the component
  const getDisplaySteps = (currentData: QuickEstimateData) => {
    return steps.filter(step => {
      // Show Battery Savings step only for HRS program or battery system
      if (step.name === 'Battery Savings') {
        return currentData.programType === 'hrs_residential' || currentData.systemType === 'battery_system'
      }
      // Show Net Metering Savings step only for net_metering program
      if (step.name === 'Net Metering Savings') {
        return currentData.programType === 'net_metering'
      }
      return true
    }).map((step, index) => ({ ...step, id: index }))
  }
  
  // Memoize displaySteps to avoid recalculating on every render
  const displaySteps = useMemo(() => getDisplaySteps(data), [data])

  // Load query parameters and pre-populate data
  useEffect(() => {
    const province = searchParams.get('province')
    const programType = searchParams.get('programType')
    const leadType = searchParams.get('leadType')
    const hasBattery = searchParams.get('hasBattery') === 'true'

    // Pre-populate province if provided
    if (province && !data.province) {
      setData(prev => ({
        ...prev,
        province,
        // Store program selection data for later use in calculations
        ...(programType && { programType: programType as 'net_metering' | 'hrs_residential' | 'quick' }),
        ...(leadType && { leadType: leadType as 'residential' | 'commercial' }),
        ...(hasBattery !== undefined && { hasBattery }),
      }))
    }
  }, [searchParams])

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress()
    if (saved && saved.data && Object.keys(saved.data).length > 0) {
      setSavedProgressData(saved)
      setShowResumeModal(true)
    } else {
      // Track estimate start if no saved progress
      if (!hasTrackedStart.current) {
        trackEstimateStarted('quick-estimate', {
          program_type: data.programType,
          lead_type: data.leadType,
          province: data.province,
        })
        hasTrackedStart.current = true
        estimateStartTime.current = Date.now()
      }
    }
  }, [])
  
  // Track estimate start when data is populated from query params
  useEffect(() => {
    if ((data.province || data.programType) && !hasTrackedStart.current) {
      trackEstimateStarted('quick-estimate', {
        program_type: data.programType,
        lead_type: data.leadType,
        province: data.province,
      })
      hasTrackedStart.current = true
      estimateStartTime.current = Date.now()
    }
  }, [data.province, data.programType, data.leadType])
  
  // Track step views
  useEffect(() => {
    if (displaySteps.length > 0 && currentStep < displaySteps.length) {
      const step = displaySteps[currentStep]
      if (step) {
        trackEstimateStep(
          step.name,
          currentStep + 1,
          displaySteps.length,
          'quick-estimate',
          {
            program_type: data.programType,
            lead_type: data.leadType,
            province: data.province,
          }
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, displaySteps.length])
  
  // Track abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (displaySteps.length > 0 && currentStep < displaySteps.length - 1 && !isSubmitted) {
        const step = displaySteps[currentStep]
        if (step) {
          const timeSpent = Math.floor((Date.now() - estimateStartTime.current) / 1000)
          trackEstimateAbandoned(
            step.name,
            currentStep + 1,
            displaySteps.length,
            'quick-estimate',
            timeSpent,
            {
              program_type: data.programType,
              lead_type: data.leadType,
              province: data.province,
            }
          )
        }
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentStep, displaySteps.length, isSubmitted, data.programType, data.leadType, data.province])

  // Auto-save progress
  useEffect(() => {
    if (Object.keys(data).length === 0 || isSubmitted) return

    saveProgress(data, currentStep)
    setLastSaved(getTimeSinceLastSave())
    setShowSaveIndicator(true)
    const timer = setTimeout(() => setShowSaveIndicator(false), 2000)

    return () => clearTimeout(timer)
  }, [data, currentStep, isSubmitted])

  // Handle step completion
  const handleStepComplete = (stepData: Partial<QuickEstimateData>) => {
    const updatedData = { ...data, ...stepData }
    setData(updatedData)

    // Track step completion
    const currentStepInfo = displaySteps[currentStep]
    if (currentStepInfo) {
      trackEstimateStepComplete(
        currentStepInfo.name,
        currentStep + 1,
        displaySteps.length,
        'quick-estimate',
        {
          program_type: updatedData.programType,
          lead_type: updatedData.leadType,
          province: updatedData.province,
        }
      )
    }

    // Recompute displaySteps with updated data
    const updatedDisplaySteps = getDisplaySteps(updatedData)

    if (currentStep < updatedDisplaySteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle going back
  const handleBack = () => {
    if (currentStep > 0) {
      // Track step back
      const step = displaySteps[currentStep]
      if (step) {
        trackEstimateStepBack(step.name, currentStep + 1, 'quick-estimate')
      }
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle final submission
  const handleSubmit = () => {
    setIsSubmitted(true)
    const timeSpent = Math.floor((Date.now() - estimateStartTime.current) / 1000)
    trackEstimateCompleted(
      'quick-estimate',
      displaySteps.length,
      timeSpent,
      {
        program_type: data.programType,
        lead_type: data.leadType,
        province: data.province,
        has_estimate: !!data.estimate,
      }
    )
    clearProgress()
  }

  // Resume progress
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setData(savedProgressData.data)
      setCurrentStep(savedProgressData.currentStep)
      setLastSaved(getTimeSinceLastSave())
    }
    setShowResumeModal(false)
  }

  // Start fresh
  const handleStartFresh = () => {
    clearProgress()
    setShowResumeModal(false)
    setSavedProgressData(null)
  }

  // Clear progress
  const handleClearProgress = () => {
    setShowClearModal(true)
  }

  const confirmClearProgress = () => {
    clearProgress()
    setData({})
    setCurrentStep(0)
    setLastSaved(null)
    setShowClearModal(false)
  }

  // Get current step component - handle Battery Savings vs Net Metering Savings
  const getCurrentStepComponent = () => {
    const step = displaySteps.find((s, idx) => idx === currentStep)
    if (!step) return StepLocation as any
    
    // If it's the savings step, choose component based on programType
    if (step.name === 'Battery Savings' || step.name === 'Net Metering Savings') {
      if (data.programType === 'net_metering') {
        return StepNetMetering
      } else {
        return StepBatteryPeakShaving
      }
    }
    
    return step.component || StepLocation as any
  }
  
  const CurrentStepComponent = getCurrentStepComponent()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Go to homepage" className="inline-flex items-center">
              <Logo size="sm" showTagline={false} />
            </Link>

            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {currentStep > 0 && !isSubmitted && (
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  {showSaveIndicator ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <Save size={14} />
                      <span>Saved</span>
                    </div>
                  ) : lastSaved ? (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Save size={14} className="opacity-50" />
                      <span>{lastSaved}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Clear progress button */}
              {currentStep > 0 && !isSubmitted && (
                <button
                  onClick={handleClearProgress}
                  className="hidden sm:flex items-center gap-1.5 text-gray-600 hover:text-red-600 transition-colors text-xs p-1.5 rounded-lg hover:bg-red-50"
                  title="Clear saved progress and start over"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {/* Exit button */}
              <Link
                href="/"
                className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1.5"
                aria-label="Exit estimator"
              >
                <span className="text-xs font-medium hidden sm:inline">Exit</span>
                <X size={20} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {!isSubmitted && (
        <div className="bg-white border-b border-gray-200 sticky top-[49px] z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {/* Mode Badge */}
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                Quick Estimate
              </span>
            </div>

            {/* Progress stepper - desktop */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {displaySteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                      currentStep > index
                        ? 'bg-navy-500 text-white'
                        : currentStep === index
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > index ? (
                      <Check size={20} />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                    currentStep >= index ? 'text-navy-500' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>

                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-3 ${
                      currentStep > index ? 'bg-navy-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress indicator - mobile */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy-500">
                  Step {currentStep + 1} of {displaySteps.length}
                </span>
                <span className="text-sm text-gray-600">
                  {displaySteps[currentStep]?.name}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / displaySteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CurrentStepComponent
          data={data}
          onComplete={handleStepComplete}
          onBack={currentStep > 0 ? handleBack : undefined}
          onSubmit={currentStep === displaySteps.length - 1 ? handleSubmit : undefined}
        />
      </main>

      {/* Resume Progress Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={handleStartFresh}
        onConfirm={handleResumeProgress}
        title="Resume Your Estimate?"
        message={
          <div className="space-y-2">
            <p>
              You have a saved estimate in progress{savedProgressData?.data.address ? ` for ${savedProgressData.data.address}` : ''} (saved {getTimeSinceLastSave()}).
            </p>
            <p>
              Would you like to resume where you left off?
            </p>
          </div>
        }
        confirmText="Resume"
        cancelText="Start Fresh"
        variant="info"
      />

      {/* Clear Progress Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearProgress}
        title="Clear Progress?"
        message="Are you sure you want to clear your saved progress and start over? This action cannot be undone."
        confirmText="Clear and Start Over"
        cancelText="Keep My Progress"
        variant="danger"
      />
    </div>
  )
}

export default function QuickEstimatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <QuickEstimateContent />
    </Suspense>
  )
}
