'use client'

// 4-Step Quick Estimate Flow
// Step 1: Location & Energy
// Step 2: Property Info
// Step 3: Results Preview
// Step 4: Get Full Quote (Contact)

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { X, Check, Save, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { StepLocationEnergy } from '@/components/quick-estimate/StepLocationEnergy'
import { StepPropertyInfo } from '@/components/quick-estimate/StepPropertyInfo'
import { StepResultsPreview } from '@/components/quick-estimate/StepResultsPreview'
import { StepGetQuote } from '@/components/quick-estimate/StepGetQuote'

// Quick Estimate data type
export interface QuickEstimateData {
  // Program selection (from query params)
  programType?: 'net_metering' | 'hrs_residential' | 'quick'
  leadType?: 'residential' | 'commercial'
  hasBattery?: boolean

  // Step 1: Location & Energy
  address?: string
  coordinates?: { lat: number; lng: number }
  city?: string
  province?: string
  email?: string
  monthlyBill?: number
  annualUsageKwh?: number
  energyEntryMethod?: 'bill' | 'usage'

  // Step 2: Property Info
  roofSizePreset?: string
  roofAreaSqft?: number
  shadingLevel?: 'none' | 'light' | 'moderate' | 'heavy'
  roofOrientation?: 'south' | 'east' | 'west' | 'north' | 'flat'
  roofAzimuth?: number

  // Step 3: Estimate Results
  estimate?: {
    systemSizeKw: number
    numPanels: number
    annualProductionKwh: number
    monthlyProductionKwh: number[]
    estimatedCost: number
    netCost: number
    annualSavings: number
    monthlySavings: number
    paybackYears: number
    co2OffsetTons: number
  }

  // Step 4: Contact Info
  fullName?: string
  phone?: string
  comments?: string
  consent?: boolean
  photos?: any[]
}

// Step definitions
const steps = [
  { id: 0, name: 'Location', component: StepLocationEnergy },
  { id: 1, name: 'Property', component: StepPropertyInfo },
  { id: 2, name: 'Results', component: StepResultsPreview },
  { id: 3, name: 'Quote', component: StepGetQuote },
]

// Local storage key for progress
const STORAGE_KEY = 'quick-estimate-progress'

function saveProgress(data: QuickEstimateData, step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      currentStep: step,
      savedAt: new Date().toISOString(),
    }))
  } catch (e) {
    console.error('Failed to save progress:', e)
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

export default function QuickEstimatePage() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<QuickEstimateData>({})
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

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
    }
  }, [])

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

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle going back
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle final submission
  const handleSubmit = () => {
    setIsSubmitted(true)
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

  // Get current step component
  const CurrentStepComponent = steps[currentStep].component

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
              {steps.map((step, index) => (
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
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-gray-600">
                  {steps[currentStep]?.name}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
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
          onSubmit={currentStep === steps.length - 1 ? handleSubmit : undefined}
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
