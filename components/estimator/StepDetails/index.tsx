'use client'

// Step 3: Property details form

import { useState } from 'react'
import { RoofSummary } from './sections/RoofSummary'
import { RoofDetailsForm } from './components/RoofDetailsForm'
import { EnergyUsageVerification } from './components/EnergyUsageVerification'
import type { StepDetailsProps } from './types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { isValidEmail } from '@/lib/utils'

export function StepDetails({ data, onComplete, onBack }: StepDetailsProps) {
  // Program type and lead type are already selected in the initial modal
  const programType = data.programType || 'hrs_residential'
  const leadType = data.leadType || 'residential'
  
  // Check if province is Alberta
  const isAlberta = data.province && (
    data.province.toUpperCase() === 'AB' || 
    data.province.toUpperCase() === 'ALBERTA' ||
    data.province.toUpperCase().includes('ALBERTA')
  )
  
  const [formData, setFormData] = useState({
    roofType: data.roofType || 'asphalt_shingle',
    roofAge: data.roofAge || '0-5',
    roofPitch: data.roofPitch || 'medium',
    shadingLevel: data.shadingLevel || 'minimal',
    monthlyBill: data.monthlyBill || '',
    roofAzimuth: data.roofAzimuth || 180, // Default to south if not detected
    annualEscalator: data.annualEscalator ?? 4.5, // Preserve existing annualEscalator, default to 4.5%
    snowLossFactor: data.snowLossFactor || (isAlberta ? 0.03 : 0), // Alberta default: 3% snow loss
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use base usage without electrification adjustments
    const baseUsage = data.energyUsage?.annualKwh || data.annualUsageKwh || 0
    
    const stepData = {
      ...formData,
      programType,
      leadType,
      // Preserve energyUsage from previous step (calculated from appliances)
      energyUsage: data.energyUsage ? {
        ...data.energyUsage,
        annualKwh: baseUsage,
      } : undefined,
      annualUsageKwh: baseUsage,
      // annualEscalator is already in formData, so it will be included automatically
    }

    // Save partial lead for detailed residential flows (both HRS and net metering)
    const email = data.email
    if (
      email &&
      isValidEmail(email) &&
      data.estimatorMode === 'detailed' &&
      leadType === 'residential'
    ) {
      void fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: {
            ...data,
            ...stepData,
            email,
          },
          currentStep: 3, // Details step
        }),
      }).catch((error) => {
        console.error('Failed to save Details progress (partial lead):', error)
      })
    }

    onComplete(stepData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-navy-500 mb-8">Property Details</h2>

        {/* Roof Summary Card */}
        {data.roofAreaSqft && (
          <RoofSummary data={data} />
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Roof Details */}
          <RoofDetailsForm
            formData={formData}
            setFormData={setFormData}
            data={data}
          />

          {/* Section 2: Energy Usage Verification */}
          <EnergyUsageVerification
            formData={formData}
            setFormData={setFormData}
            data={data}
          />

          {/* User data accuracy disclaimer */}
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
            <InfoTooltip
              content="Results rely on the information entered by the user. Incorrect or incomplete details—such as roof age, shading, azimuth, or usage verification—will impact the accuracy of the system design and savings estimates."
            />
            <span>Roof details and usage assumptions you enter directly affect design and savings estimates.</span>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

