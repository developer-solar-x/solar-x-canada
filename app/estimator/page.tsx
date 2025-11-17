'use client'

// Multi-step solar estimator page

import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { X, Check, Save, Trash2 } from 'lucide-react'
import { convertEasyToDetailed } from '@/lib/mode-converter'
import { saveEstimatorProgress, loadEstimatorProgress, clearEstimatorProgress, getTimeSinceLastSave } from '@/lib/estimator-storage'
import { isValidEmail } from '@/lib/utils'
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
import { StepBatteryPeakShavingSimple as StepBatteryPeakShaving } from '@/components/estimator/StepBatteryPeakShavingSimple'
import { StepDetails } from '@/components/estimator/StepDetails'
import { StepDetailsSimple } from '@/components/estimator/StepDetailsSimple'
import { StepReview } from '@/components/estimator/StepReview'
import { StepContact } from '@/components/estimator/StepContact'

// Estimator data type
export interface EstimatorData {
  // Step 0: Mode selection
  estimatorMode?: 'easy' | 'detailed'
  // Program selection
  programType?: 'quick' | 'hrs_residential' | 'net_metering'
  // Lead type (residential or commercial)
  leadType?: 'residential' | 'commercial'
  
  // Commercial-specific fields
  billingMethod?: 'Per kVA' | 'Per kW' | 'Max(kW, 0.9×kVA)'
  demandRatePerUnit30d?: number
  measuredPeakKVA?: number
  currentPF?: number
  targetPF?: number
  targetCapKW?: number
  shaveKW?: number
  peakDurationMin?: number
  batteryCRate?: number
  roundTripEff?: number
  usableDOD?: number
  installedCostTotal?: number
  solarACElligibleKW?: number
  rebateRatePerKW?: number
  rebateCapDollar?: number
  applySolar50Cap?: boolean
  solarOnlyCost?: number
  analysisYears?: number
  annualEscalator?: number
  greenButtonData?: any
  intervalKW?: Array<{ ts: string; kW: number }>
  commercialResults?: any
  
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
  annualUsageKwh?: number
  
  // Step 5: System type and add-ons
  hasBattery?: boolean
  // Picking the overall vibe for the solar setup
  systemType?: 'battery_system' | 'grid_tied'
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
  { id: 0, name: 'Program', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Roof Size', component: StepRoofSimple },
  { id: 3, name: 'Energy', component: StepEnergySimple }, // Moved up - capture consumption early
  { id: 4, name: 'Battery Savings', component: StepBatteryPeakShaving, optional: true },
  { id: 5, name: 'Add-ons', component: StepAddOns },
  { id: 6, name: 'Photos', component: StepPhotosSimple },
  { id: 7, name: 'Details', component: StepDetailsSimple },
  { id: 8, name: 'Review', component: StepReview },
  { id: 9, name: 'Submit', component: StepContact },
]

// Step definitions for Detailed Mode (Solar-only focused)
const detailedSteps = [
  { id: 0, name: 'Program', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Draw Roof', component: StepDrawRoof },
  { id: 3, name: 'Details', component: StepDetails }, // Moved up - capture consumption early
  { id: 4, name: 'Battery Savings', component: StepBatteryPeakShaving, optional: true },
  { id: 5, name: 'Add-ons', component: StepAddOns },
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
  // Clear progress modal
  const [showClearModal, setShowClearModal] = useState(false)
  // Resume progress modal
  const [showResumeModal, setShowResumeModal] = useState(false)
  // Saved progress data for resume modal
  const [savedProgressData, setSavedProgressData] = useState<any>(null)
  // Track if email was already captured
  const [emailCaptured, setEmailCaptured] = useState(false)
  // Loading indicator when moving from Step 3 -> Step 4 (estimate prefetch)
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false)

  // Get active step array based on mode
  const steps = data.estimatorMode === 'easy' 
    ? easySteps 
    : data.estimatorMode === 'detailed' 
    ? detailedSteps 
    : [easySteps[0]]
  
  // Filter steps based on mode and conditions
  const displaySteps = steps.filter(step => {
    // Show Battery Savings step only for HRS program (residential)
    if (step.name === 'Battery Savings') {
      return data.programType === 'hrs_residential' || data.systemType === 'battery_system'
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
    const saveIndicatorTimer = setTimeout(() => setShowSaveIndicator(false), 2000)
    
    // Also save to partial leads database if email exists (required for partial leads)
    // Exclude map snapshots from frequent saves to improve efficiency (they're large base64 images)
    // Map snapshots are only saved when explicitly needed (e.g., when roof drawing is completed)
    let partialLeadTimer: NodeJS.Timeout | null = null
    if (data.email && isValidEmail(data.email)) {
      // Debounce partial lead saves to avoid excessive API calls
      partialLeadTimer = setTimeout(async () => {
        try {
          // Create a copy of data without map snapshot for efficient saving
          // Map snapshots are large base64 images (500KB-2MB+) and significantly increase payload size
          // Exclude from frequent auto-saves to improve performance
          // Map snapshots are saved separately when explicitly provided (see handleStepComplete)
          const dataWithoutSnapshot = { ...data }
          if (dataWithoutSnapshot.mapSnapshot) {
            delete dataWithoutSnapshot.mapSnapshot
          }
          
          const response = await fetch('/api/partial-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              estimatorData: dataWithoutSnapshot,
              currentStep: currentStep,
            }),
          })
          
          if (response.ok) {
            console.log('Progress saved to partial leads database')
          }
        } catch (error) {
          console.error('Failed to save to partial leads:', error)
          // Fail silently - don't break the user experience
        }
      }, 1000) // Debounce 1 second
    }
    
    // Cleanup function for both timers
    return () => {
      clearTimeout(saveIndicatorTimer)
      if (partialLeadTimer) {
        clearTimeout(partialLeadTimer)
      }
    }
  }, [data, currentStep])

  // Update data and move to next step
  const handleStepComplete = async (stepData: Partial<EstimatorData>) => {
    // Preserve email if it already exists (captured in location step)
    // Only overwrite email if stepData explicitly provides a new non-empty email
    const updatedData = { 
      ...data, 
      ...stepData,
      // Preserve email from location step unless stepData explicitly provides a new non-empty email
      email: (stepData.email && stepData.email.trim()) ? stepData.email : data.email
    }
    setData(updatedData)
    
    // If map snapshot is included in stepData (e.g., from roof drawing step), save it to partial leads
    // This ensures map snapshots are saved when they're created, but not on every step
    if (stepData.mapSnapshot && updatedData.email && isValidEmail(updatedData.email)) {
      // Save with map snapshot when it's explicitly provided (roof drawing completion)
      setTimeout(async () => {
        try {
          const response = await fetch('/api/partial-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: updatedData.email,
              estimatorData: updatedData,
              currentStep: currentStep,
            }),
          })
          
          if (response.ok) {
            console.log('Progress with map snapshot saved to partial leads')
          }
        } catch (error) {
          console.error('Failed to save map snapshot to partial leads:', error)
        }
      }, 500) // Small delay to ensure data is updated
    }
    
    // Special handling for mode selection (step 0)
    if (currentStep === 0 && stepData.estimatorMode) {
      setCurrentStep(1) // Always go to step 1 after mode selection
    } else {
      // Get the correct steps array after data update
      const newMode = stepData.estimatorMode || data.estimatorMode
      const nextSteps = newMode === 'easy' 
        ? easySteps 
        : newMode === 'detailed' 
        ? detailedSteps 
        : [easySteps[0]]
      
      if (currentStep < nextSteps.length - 1) {
        let nextStep = currentStep + 1

        // Skip Battery Savings step entirely when not in HRS program
        while (
          nextStep < nextSteps.length &&
          nextSteps[nextStep]?.name === 'Battery Savings' &&
          updatedData.programType !== 'hrs_residential' &&
          updatedData.systemType !== 'battery_system'
        ) {
          nextStep += 1
        }
        
        // Prepare data before Battery Savings (step 4) when program is HRS Residential
        const willEnterBatterySavings =
          currentStep === 3 &&
          (updatedData.programType === 'hrs_residential' || updatedData.systemType === 'battery_system')
        if (willEnterBatterySavings && updatedData.coordinates && (updatedData.roofPolygon || updatedData.roofAreaSqft)) {
          try {
            // Show loading overlay while preparing the Battery Savings step
            setIsLoadingNextStep(true)
            console.log('Generating solar estimate for battery rebate calculation...')
            const response = await fetch('/api/estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData),
            })
            
            if (response.ok) {
              const result = await response.json()
              // Store the estimate in data for use in Battery Savings step
              setData(prev => ({ ...prev, estimate: result.data }))
              console.log('Solar estimate generated:', result.data.system)
            } else {
              console.warn('Failed to generate estimate, will retry in Review step')
            }
          } catch (error) {
            console.error('Error generating estimate:', error)
            // Continue anyway - estimate will be generated in Review step as fallback
          } finally {
            // Proceed to next step and hide loading overlay
            setCurrentStep(nextStep)
            setIsLoadingNextStep(false)
          }
          // Early return because we advanced step inside finally
          return
        }
        
        setCurrentStep(Math.min(nextStep, nextSteps.length - 1))
        
        // Email is now required on Location step, so no need for save modal
        // Update emailCaptured state if email was provided in location step
        if (updatedData.email && isValidEmail(updatedData.email)) {
          setEmailCaptured(true)
        }
      }
    }
  }


  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      const stepsForMode = data.estimatorMode === 'easy' 
        ? easySteps 
        : data.estimatorMode === 'detailed' 
        ? detailedSteps 
        : easySteps
      let prevStep = currentStep - 1

      while (
        prevStep > 0 &&
        stepsForMode[prevStep]?.name === 'Battery Savings' &&
        data.programType !== 'hrs_residential' &&
        data.systemType !== 'battery_system'
      ) {
        prevStep -= 1
      }

      setCurrentStep(Math.max(prevStep, 0))
    }
  }

  // Handle mode upgrade (Easy -> Detailed)
  const handleUpgradeMode = () => {
    // Convert easy mode data to detailed mode format
    const convertedData = convertEasyToDetailed(data)
    setData(prev => ({ ...prev, ...convertedData }))
    
    // Map current easy step to equivalent detailed step
    // Easy: 0=Program, 1=Location, 2=Roof, 3=Energy, 4=Battery, 5=Add-ons, 6=Photos, 7=Details, 8=Review, 9=Submit
    // Detailed: 0=Program, 1=Location, 2=Draw Roof, 3=Details, 4=Battery, 5=Add-ons, 6=Photos, 7=Review, 8=Submit
    const stepMapping: Record<number, number> = {
      2: 2, // Roof Size -> Draw Roof (same step number)
      3: 3, // Energy Simple -> Details (energy info is part of Details in detailed mode)
      4: 4, // Battery Savings -> Battery Savings (same step number)
      5: 5, // Add-ons -> Add-ons (same step number)
      6: 6, // Photos Simple -> Photos (same step number)
      7: 3, // Details Simple -> Details (already passed, go to Details step)
    }
    
    // If on step 7 (Details Simple), we've already collected energy, so go to Details step
    // If on step 3 (Energy), go to Details step which includes energy info
    let newStep = stepMapping[currentStep]
    if (newStep === undefined) {
      // Default: try to stay on same step number, or go to Details if we've passed Energy
      if (currentStep >= 3 && currentStep < 7) {
        newStep = 3 // Go to Details step in detailed mode
      } else {
        newStep = currentStep
      }
    }
    
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
                data.programType === 'hrs_residential'
                  ? 'bg-navy-100 text-navy-600'
                  : data.estimatorMode === 'easy' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-navy-100 text-navy-600'
              }`}>
                {data.programType === 'hrs_residential' 
                  ? 'Solar HRS Program' 
                  : data.estimatorMode === 'easy' 
                    ? 'Quick Estimate' 
                    : 'Detailed Analysis'}
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
          <CurrentStepComponent
            data={data}
            onComplete={handleStepComplete}
            onBack={undefined as any}
          />
        ) : (
          <CurrentStepComponent
            data={data}
            onComplete={handleStepComplete}
            onBack={handleBack}
            {...(data.estimatorMode === 'easy' && currentStep > 1 ? { onUpgradeMode: handleUpgradeMode } : {})}
          />
        )}
      </main>

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
              {savedProgressData.data.programType === 'hrs_residential' 
                ? 'Solar HRS Program' 
                : savedProgressData.data.estimatorMode === 'easy' 
                  ? 'Quick Estimate' 
                  : 'Detailed Analysis'}
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

      {/* Fullscreen loading overlay during step 3 -> 4 transition */}
      {isLoadingNextStep && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4">
            <div className="h-6 w-6 rounded-full border-2 border-navy-500 border-t-transparent animate-spin" />
            <div className="text-sm text-navy-600 font-medium">Preparing battery savings…</div>
          </div>
        </div>
      )}
    </div>
  )
}

