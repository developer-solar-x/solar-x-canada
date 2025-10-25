'use client'

// Multi-step solar estimator page

import { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { X, Check, Save, Trash2 } from 'lucide-react'
import { convertEasyToDetailed } from '@/lib/mode-converter'
import { saveEstimatorProgress, loadEstimatorProgress, clearEstimatorProgress, getTimeSinceLastSave } from '@/lib/estimator-storage'
import { SaveProgressModal } from '@/components/ui/SaveProgressModal'
import { StepModeSelector } from '@/components/estimator/StepModeSelector'
import { StepLocation } from '@/components/estimator/StepLocation'
import { StepDrawRoof } from '@/components/estimator/StepDrawRoof'
import { StepRoofSimple } from '@/components/estimator/StepRoofSimple'
import { StepPhotos } from '@/components/estimator/StepPhotos'
import { StepPhotosSimple } from '@/components/estimator/StepPhotosSimple'
import { StepAppliances } from '@/components/estimator/StepAppliances'
import { StepEnergySimple } from '@/components/estimator/StepEnergySimple'
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
  
  // Step 3: Property photos
  photos?: any[]
  photoSummary?: any
  
  // Step 4: Energy (easy or detailed)
  appliances?: any[]
  homeSize?: string
  specialAppliances?: string[]
  energyEntryMethod?: 'simple' | 'detailed'
  energyUsage?: {
    dailyKwh: number
    monthlyKwh: number
    annualKwh: number
  }
  
  // Step 5: Property details
  roofType?: string
  roofAge?: string
  roofPitch?: string
  shadingLevel?: string
  monthlyBill?: number
  
  // Step 6: Estimate results
  estimate?: any
}

// Step definitions for Easy Mode
const easySteps = [
  { id: 0, name: 'Mode', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Roof Size', component: StepRoofSimple },
  { id: 3, name: 'Photos', component: StepPhotosSimple },
  { id: 4, name: 'Energy', component: StepEnergySimple },
  { id: 5, name: 'Details', component: StepDetailsSimple },
  { id: 6, name: 'Review', component: StepReview },
  { id: 7, name: 'Submit', component: StepContact },
]

// Step definitions for Detailed Mode
const detailedSteps = [
  { id: 0, name: 'Mode', component: StepModeSelector },
  { id: 1, name: 'Location', component: StepLocation },
  { id: 2, name: 'Draw Roof', component: StepDrawRoof },
  { id: 3, name: 'Photos', component: StepPhotos },
  { id: 4, name: 'Appliances', component: StepAppliances },
  { id: 5, name: 'Details', component: StepDetails },
  { id: 6, name: 'Review', component: StepReview },
  { id: 7, name: 'Submit', component: StepContact },
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
  // Track if email was already captured
  const [emailCaptured, setEmailCaptured] = useState(false)

  // Get active step array based on mode
  const steps = data.estimatorMode === 'easy' ? easySteps : data.estimatorMode === 'detailed' ? detailedSteps : [easySteps[0]]

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadEstimatorProgress()
    
    if (saved) {
      // Ask user if they want to resume
      const shouldResume = confirm(
        `You have a saved estimate in progress (${saved.data.address || 'started ' + getTimeSinceLastSave()}).\n\nWould you like to resume where you left off?`
      )
      
      if (shouldResume) {
        setData(saved.data)
        setCurrentStep(saved.currentStep)
        setLastSaved(getTimeSinceLastSave())
        console.log('✅ Resumed from step', saved.currentStep)
      } else {
        // User wants to start fresh
        clearEstimatorProgress()
      }
    }
  }, [])

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
        setCurrentStep(prev => prev + 1)
        
        // Show save modal after Step 3 (Photos) if email not captured yet
        if (currentStep === 3 && !emailCaptured && data.address) {
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
      setCurrentStep(prev => prev - 1)
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
    if (confirm('Are you sure you want to clear your saved progress and start over?')) {
      clearEstimatorProgress()
      setData({})
      setCurrentStep(0)
      setLastSaved(null)
    }
  }

  // Get current step component
  const CurrentStepComponent = steps[currentStep]?.component || StepModeSelector as any

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simple logo and exit */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-responsive py-fluid-sm">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <Logo size="md" showTagline={false} />
            </Link>

            {/* Save indicator and controls */}
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              {currentStep > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-fluid-sm">
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
                  className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-fluid-sm p-fluid-sm rounded-lg hover:bg-red-50"
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
                <span className="text-fluid-sm font-medium hidden sm:inline">Exit</span>
                <X size={24} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps Container - Only show after mode selection */}
      {data.estimatorMode && (
        <div className="bg-white border-b border-gray-200 sticky top-[73px] z-30">
          <div className="container-responsive py-fluid-md">
            {/* Mode Badge */}
            <div className="text-center mb-4">
              <span className={`inline-block px-4 py-1 rounded-full text-fluid-xs font-bold ${
                data.estimatorMode === 'easy' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-navy-100 text-navy-600'
              }`}>
                {data.estimatorMode === 'easy' ? 'Quick Estimate' : 'Detailed Analysis'}
              </span>
            </div>

            {/* Progress stepper - desktop */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {steps.slice(1).map((step, index) => (
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
                  <span className={`ml-2 text-fluid-sm font-medium whitespace-nowrap ${
                    currentStep >= step.id ? 'text-navy-500' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>

                  {/* Connecting line */}
                  {index < steps.length - 2 && (
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
                <span className="text-fluid-sm font-semibold text-navy-500">
                  Step {currentStep} of {steps.length - 1}
                </span>
                <span className="text-fluid-sm text-gray-600">
                  {steps[currentStep]?.name}
                </span>
              </div>
              {/* Progress bar - mobile */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container-responsive py-fluid-md md:py-fluid-lg">
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
    </div>
  )
}

