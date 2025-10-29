'use client'

// Multi-step solar estimator page

import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { X, Check, Save, Trash2 } from 'lucide-react'
import { convertEasyToDetailed } from '@/lib/mode-converter'
import { saveEstimatorProgress, loadEstimatorProgress, clearEstimatorProgress, getTimeSinceLastSave } from '@/lib/estimator-storage'
import { SaveProgressModal } from '@/components/ui/SaveProgressModal'
import { Modal } from '@/components/ui/Modal'
import { StepModeSelector } from '@/components/estimator/StepModeSelector'
import { StepLocation } from '@/components/estimator/StepLocation'
import { StepDrawRoof } from '@/components/estimator/StepDrawRoof'
import { StepRoofSimple } from '@/components/estimator/StepRoofSimple'
import { StepPhotos } from '@/components/estimator/StepPhotos'
import { StepPhotosSimple } from '@/components/estimator/StepPhotosSimple'
// import { StepAppliances } from '@/components/estimator/StepAppliances' // Temporarily disabled - solar only
import { StepEnergySimple } from '@/components/estimator/StepEnergySimple'
import { StepAddOns } from '@/components/estimator/StepAddOns'
import { StepBatteryPeakShaving } from '@/components/estimator/StepBatteryPeakShaving'
import { StepDetails } from '@/components/estimator/StepDetails'
import { StepDetailsSimple } from '@/components/estimator/StepDetailsSimple'
import { StepReview } from '@/components/estimator/StepReview'
import { StepContact } from '@/components/estimator/StepContact'

// Estimator data type
export interface EstimatorData {
  // Step 0: Mode selection
  estimatorMode?: 'easy' | 'detailed'
  
  // Step 1: Location
  address?: string
  coordinates?: { lat: number; lng: number }
  
  // Email (captured early for progress saving)
  email?: string
  
  // Step 2: Roof (easy or detailed)
  roofPolygon?: any
  roofAreaSqft?: number
  roofSizePreset?: string
  roofEntryMethod?: 'preset' | 'manual' | 'drawn'
  mapSnapshot?: string
  roofAzimuth?: number // Roof orientation in degrees (0-360)
  
  // Step 3: Property photos
  photos?: any[]
  photoSummary?: any
  
  // Step 4: Energy (easy or detailed) - APPLIANCES TEMPORARILY DISABLED FOR SOLAR-ONLY
  // appliances?: any[]
  homeSize?: string
  specialAppliances?: string[]
  energyEntryMethod?: 'simple' | 'detailed'
  energyUsage?: {
    dailyKwh: number
    monthlyKwh: number
    annualKwh: number
  }
  
  // Step 5: System type and add-ons
  systemType?: 'grid_tied' | 'battery_system'
  hasBattery?: boolean
  selectedAddOns?: string[]
  
  // Step 5.5: Peak shaving and battery selection (only if battery system selected)
  selectedBattery?: string
  batteryDetails?: any
  peakShaving?: {
    ratePlan: string
    annualUsageKwh: number
    selectedBattery: string
    comparisons: any[]
  }
  
  // Step 6: Property details
  roofType?: string
  roofAge?: string
  roofPitch?: string
  shadingLevel?: string
  monthlyBill?: number
  
  // Step 7: Financing preference
  financingOption?: string
  
  // Step 8: Estimate results
  estimate?: any
}

// Step definitions for Easy Mode (Solar-only focused)
const easySteps = [
  { id: 0, name: 'Mode', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Roof Size', component: StepRoofSimple },
  { id: 3, name: 'Energy', component: StepEnergySimple }, // Moved up - capture consumption early
  { id: 4, name: 'System Type', component: StepAddOns },
  { id: 5, name: 'Battery Savings', component: StepBatteryPeakShaving, optional: true }, // Only shows if battery selected
  { id: 6, name: 'Photos', component: StepPhotosSimple },
  { id: 7, name: 'Details', component: StepDetailsSimple },
  { id: 8, name: 'Review', component: StepReview },
  { id: 9, name: 'Submit', component: StepContact },
]

// Step definitions for Detailed Mode (Solar-only focused)
const detailedSteps = [
  { id: 0, name: 'Mode', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Draw Roof', component: StepDrawRoof },
  { id: 3, name: 'Details', component: StepDetails }, // Moved up - capture consumption early
  { id: 4, name: 'System Type', component: StepAddOns },
  { id: 5, name: 'Battery Savings', component: StepBatteryPeakShaving, optional: true }, // Only shows if battery selected
  { id: 6, name: 'Photos', component: StepPhotos },
  { id: 7, name: 'Review', component: StepReview },
  { id: 8, name: 'Submit', component: StepContact },
]

export default function EstimatorPage() {
  // Current step state (starts at 0 for mode selector)
  const [currentStep, setCurrentStep] = useState(0)
  // Estimator data state
  const [data, setData] = useState<EstimatorData>({})
  // Last save timestamp state
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  // Show save indicator
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  // Save progress modal
  const [showSaveModal, setShowSaveModal] = useState(false)
  // Clear progress modal
  const [showClearModal, setShowClearModal] = useState(false)
  // Resume progress modal
  const [showResumeModal, setShowResumeModal] = useState(false)
  // Saved progress data for resume modal
  const [savedProgressData, setSavedProgressData] = useState<any>(null)
  // Track if email was already captured
  const [emailCaptured, setEmailCaptured] = useState(false)

  // Get active step array based on mode
  const steps = data.estimatorMode === 'easy' ? easySteps : data.estimatorMode === 'detailed' ? detailedSteps : [easySteps[0]]
  
  // Filter out Battery Savings step if grid-tied system is selected
  const displaySteps = steps.filter(step => {
    // Always show Battery Savings step if battery system is selected or not yet decided
    if (step.name === 'Battery Savings') {
      return data.systemType === 'battery_system' || data.hasBattery || !data.systemType
    }
    return true
  })

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadEstimatorProgress()
    
    if (saved) {
      // Show modal to ask user if they want to resume
      setSavedProgressData(saved)
      setShowResumeModal(true)
    }
  }, [])

  // Handle resume confirmation
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setData(savedProgressData.data)
      setCurrentStep(savedProgressData.currentStep)
      setLastSaved(getTimeSinceLastSave())
      console.log('✅ Resumed from step', savedProgressData.currentStep)
    }
    setShowResumeModal(false)
  }

  // Handle start fresh
  const handleStartFresh = async () => {
    await clearEstimatorProgress()
    setShowResumeModal(false)
    setSavedProgressData(null)
  }

  // Auto-save progress after each data update
  useEffect(() => {
    // Don't save if no data yet or if on mode selection
    if (Object.keys(data).length === 0 || currentStep === 0) {
      return
    }

    // Save to localStorage
    saveEstimatorProgress(data, currentStep)
    setLastSaved(getTimeSinceLastSave())
    
    // Show save indicator briefly
    setShowSaveIndicator(true)
    const timer = setTimeout(() => setShowSaveIndicator(false), 2000)
    
    return () => clearTimeout(timer)
  }, [data, currentStep])

  // Update data and move to next step
  const handleStepComplete = (stepData: Partial<EstimatorData>) => {
    setData(prev => ({ ...prev, ...stepData }))
    
    // Special handling for mode selection (step 0)
    if (currentStep === 0 && stepData.estimatorMode) {
      setCurrentStep(1) // Always go to step 1 after mode selection
    } else {
      // Get the correct steps array after data update
      const newMode = stepData.estimatorMode || data.estimatorMode
      const nextSteps = newMode === 'easy' ? easySteps : newMode === 'detailed' ? detailedSteps : [easySteps[0]]
      
      if (currentStep < nextSteps.length - 1) {
        let nextStep = currentStep + 1
        
        // Skip peak-shaving step if grid-tied system (no battery) was selected
        // Easy mode: Step 4 is Add-ons/System Type, Step 5 is Battery Savings
        // Detailed mode: Step 4 is Add-ons/System Type, Step 5 is Battery Savings
        const isAddOnsStep = (data.estimatorMode === 'easy' && currentStep === 4) || 
                             (data.estimatorMode === 'detailed' && currentStep === 4)
        
        // Check if battery system was selected (either from new systemType or hasBattery flag)
        const hasBattery = stepData.hasBattery || data.hasBattery || stepData.systemType === 'battery_system' || data.systemType === 'battery_system'
        
        // If completing Add-ons step and grid-tied system (no battery), skip Battery Savings step
        if (isAddOnsStep && !hasBattery) {
          nextStep = currentStep + 2 // Skip the Battery Savings step
        }
        
        setCurrentStep(nextStep)
        
        // Show save modal after energy/consumption step if email not captured yet
        // This ensures we capture consumption/bill data which is critical for peak shaving
        // Easy mode: Step 3 (Energy) - moved up to capture consumption early
        // Detailed mode: Step 3 (Details) - moved up to capture consumption early
        const isEnergyStep = (data.estimatorMode === 'easy' && currentStep === 3) || 
                             (data.estimatorMode === 'detailed' && currentStep === 3)
        
        if (isEnergyStep && !emailCaptured && data.address) {
          setTimeout(() => setShowSaveModal(true), 500) // Small delay for smooth transition
        }
      }
    }
  }

  // Handle email save from modal
  const handleSaveWithEmail = async (email: string) => {
    try {
      const response = await fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: { ...data, email }, // Include email in data
          currentStep,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save progress')
      }

      setEmailCaptured(true)
      setData(prev => ({ ...prev, email }))
      
      // Also save to localStorage
      saveEstimatorProgress({ ...data, email }, currentStep)
      
      console.log('✅ Progress saved to database with email')
    } catch (error) {
      console.error('❌ Failed to save progress:', error)
      throw error
    }
  }

  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1
      
      // Skip peak-shaving step when going back if grid-tied system (no battery)
      // Easy mode: Step 5 is Battery Savings, Step 4 is System Type/Add-ons
      // Detailed mode: Step 5 is Battery Savings, Step 4 is System Type/Add-ons
      const isPeakShavingStep = (data.estimatorMode === 'easy' && currentStep === 6) || 
                                 (data.estimatorMode === 'detailed' && currentStep === 6)
      
      // Check if battery system was selected
      const hasBattery = data.hasBattery || data.systemType === 'battery_system'
      
      // If on Photos/Details step and grid-tied system, skip Battery Savings step when going back
      if (isPeakShavingStep && !hasBattery) {
        prevStep = currentStep - 2 // Skip the Battery Savings step
      }
      
      setCurrentStep(prevStep)
    }
  }

  // Handle mode upgrade (Easy -> Detailed)
  const handleUpgradeMode = () => {
    // Convert easy mode data to detailed mode format
    const convertedData = convertEasyToDetailed(data)
    setData(prev => ({ ...prev, ...convertedData }))
    
    // Map current easy step to equivalent detailed step
    const stepMapping: Record<number, number> = {
      2: 2, // Roof Size -> Draw Roof
      3: 3, // Photos Simple -> Photos
      4: 4, // Energy Simple -> Appliances
      5: 5, // Details Simple -> Details
    }
    
    const newStep = stepMapping[currentStep] || currentStep
    setCurrentStep(newStep)
  }

  // Handle clearing progress
  const handleClearProgress = () => {
    setShowClearModal(true)
  }

  // Confirm clearing progress
  const confirmClearProgress = async () => {
    await clearEstimatorProgress()
    setData({})
    setCurrentStep(0)
    setLastSaved(null)
    setShowClearModal(false)
  }

  // Get current step component
  const CurrentStepComponent = steps[currentStep]?.component || StepModeSelector as any

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simple logo and exit */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <Logo size="md" showTagline={false} />
            </Link>

            {/* Save indicator and controls */}
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              {currentStep > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  {showSaveIndicator ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Save size={16} />
                      <span>Saved</span>
                    </div>
                  ) : lastSaved ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Save size={16} className="opacity-50" />
                      <span>{lastSaved}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Clear progress button */}
              {currentStep > 0 && (
                <button
                  onClick={handleClearProgress}
                  className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm p-2 rounded-lg hover:bg-red-50"
                  title="Clear saved progress and start over"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Exit button */}
              <Link
                href="/"
                className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-2"
                aria-label="Exit estimator"
              >
                <span className="text-sm font-medium hidden sm:inline">Exit</span>
                <X size={24} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps Container - Only show after mode selection */}
      {data.estimatorMode && (
        <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Mode Badge */}
            <div className="text-center mb-4">
              <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold ${
                data.estimatorMode === 'easy' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-navy-100 text-navy-600'
              }`}>
                {data.estimatorMode === 'easy' ? 'Quick Estimate' : 'Detailed Analysis'}
              </span>
            </div>

            {/* Progress stepper - desktop */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {displaySteps.slice(1).map((step, index) => (
                <div key={step.id} className="flex items-center">
                  {/* Step circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                      currentStep > step.id
                        ? 'bg-navy-500 text-white'
                        : currentStep === step.id
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check size={20} />
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  {/* Step name */}
                  <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                    currentStep >= step.id ? 'text-navy-500' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>

                  {/* Connecting line */}
                  {index < displaySteps.length - 2 && (
                    <div className={`w-8 h-0.5 mx-3 ${
                      currentStep > step.id ? 'bg-navy-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress indicator - mobile */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy-500">
                  Step {currentStep} of {displaySteps.length - 1}
                </span>
                <span className="text-sm text-gray-600">
                  {steps[currentStep]?.name}
                </span>
              </div>
              {/* Progress bar - mobile */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / (displaySteps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 0 ? (
          <CurrentStepComponent onComplete={handleStepComplete} />
        ) : (
          <CurrentStepComponent
            data={data}
            onComplete={handleStepComplete}
            onBack={currentStep > 0 ? handleBack : undefined}
            onUpgradeMode={data.estimatorMode === 'easy' && currentStep > 1 ? handleUpgradeMode : undefined}
          />
        )}
      </main>

      {/* Save Progress Modal */}
      <SaveProgressModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveWithEmail}
        currentStep={currentStep}
      />

      {/* Resume Progress Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={handleStartFresh}
        onConfirm={handleResumeProgress}
        title="Resume Your Estimate?"
        message={`You have a saved estimate in progress${savedProgressData?.data.address ? ` for ${savedProgressData.data.address}` : ''} (saved ${getTimeSinceLastSave()}).\n\nWould you like to resume where you left off?`}
        confirmText="Resume"
        cancelText="Start Fresh"
        variant="info"
      >
        {savedProgressData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              {savedProgressData.data.estimatorMode === 'easy' ? 'Quick Estimate' : 'Detailed Analysis'}
            </p>
            <p className="text-sm text-blue-600">
              Step {savedProgressData.currentStep}
            </p>
          </div>
        )}
      </Modal>

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

