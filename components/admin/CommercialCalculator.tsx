'use client'

// Commercial Battery Demand Charge Calculator - Admin Panel Version
// Wraps the commercial estimator components for use in admin panel

import { useState } from 'react'
import { StepCommercialTariff } from '@/components/admin/StepCommercialTariff'
import { StepCommercialPeakShaving } from '@/components/admin/StepCommercialPeakShaving'
import { StepCommercialBattery } from '@/components/admin/StepCommercialBattery'
import { StepCommercialCosts } from '@/components/admin/StepCommercialCosts'
import { StepCommercialResults } from '@/components/admin/StepCommercialResults'
import { Building2, Calculator } from 'lucide-react'

export function CommercialCalculator() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<any>({})

  const steps = [
    { id: 0, name: 'Tariff', component: StepCommercialTariff },
    { id: 1, name: 'Peak Shaving', component: StepCommercialPeakShaving },
    { id: 2, name: 'Battery Specs', component: StepCommercialBattery },
    { id: 3, name: 'Costs & Rebate', component: StepCommercialCosts },
    { id: 4, name: 'Results', component: StepCommercialResults },
  ]

  const handleStepComplete = (stepData: any) => {
    const updatedData = { ...data, ...stepData }
    setData(updatedData)
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const CurrentStepComponent = steps[currentStep]?.component

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calculator className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy-500">Commercial Demand Charge Calculator</h1>
            <p className="text-gray-600">Calculate battery savings for Class-B commercial properties</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                  currentStep > step.id
                    ? 'bg-navy-500 text-white'
                    : currentStep === step.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  currentStep > step.id ? 'bg-navy-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Component */}
      {CurrentStepComponent && (
        <CurrentStepComponent
          data={data}
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      )}

      {/* Info Box */}
      <div className="mt-8 card p-6 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <Building2 className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <strong>About this calculator:</strong> This tool calculates demand charge savings from Power Factor 
            correction and Battery Peak Shaving for commercial Class-B properties. It does not include solar 
            panel sizing or rooftop calculations.
          </div>
        </div>
      </div>
    </div>
  )
}

