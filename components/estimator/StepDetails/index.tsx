'use client'

// Step 3: Property details form

import { useState } from 'react'
import { RoofSummary } from './sections/RoofSummary'
import { RoofDetailsForm } from './components/RoofDetailsForm'
import { EnergyUsageVerification } from './components/EnergyUsageVerification'
import type { StepDetailsProps } from './types'

export function StepDetails({ data, onComplete, onBack }: StepDetailsProps) {
  // Program type and lead type are already selected in the initial modal
  const programType = data.programType || 'hrs_residential'
  const leadType = data.leadType || 'residential'
  
  const [formData, setFormData] = useState({
    roofType: data.roofType || 'asphalt_shingle',
    roofAge: data.roofAge || '0-5',
    roofPitch: data.roofPitch || 'medium',
    shadingLevel: data.shadingLevel || 'minimal',
    monthlyBill: data.monthlyBill || '',
    roofAzimuth: data.roofAzimuth || 180, // Default to south if not detected
    annualEscalator: data.annualEscalator, // Preserve existing annualEscalator
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      ...formData,
      programType,
      leadType,
      // Preserve energyUsage from previous step (calculated from appliances)
      energyUsage: data.energyUsage,
      annualUsageKwh: data.energyUsage?.annualKwh || data.annualUsageKwh,
      // annualEscalator is already in formData, so it will be included automatically
    })
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

