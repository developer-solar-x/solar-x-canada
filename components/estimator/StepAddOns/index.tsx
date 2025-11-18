'use client'

// Step for selecting system type and additional products/services (add-ons)

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { ADD_ONS } from './constants'
import { AddOnCard } from './components/AddOnCard'
import { SelectedSummary } from './components/SelectedSummary'
import type { StepAddOnsProps } from './types'

export function StepAddOns({ data, onComplete, onBack }: StepAddOnsProps) {
  // Add-ons only
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(data.selectedAddOns || [])

  // Toggle add-on selection
  const toggleAddOn = (addOnId: string) => {
    if (selectedAddOns.includes(addOnId)) {
      // Remove if already selected
      setSelectedAddOns(selectedAddOns.filter(id => id !== addOnId))
    } else {
      // Add if not selected
      setSelectedAddOns([...selectedAddOns, addOnId])
    }
  }

  // Handle continue
  const handleContinue = () => {
    onComplete({ selectedAddOns })
  }

  // Handle skip (no add-ons selected but system type is required)
  const handleSkip = () => {
    onComplete({ selectedAddOns: [] })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Add-ons Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-navy-500 mb-3">
            Additional Add-Ons (Optional)
          </h3>
        </div>

        {/* Add-ons grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {ADD_ONS.map((addOn) => (
            <AddOnCard
              key={addOn.id}
              addOn={addOn}
              isSelected={selectedAddOns.includes(addOn.id)}
              onToggle={() => toggleAddOn(addOn.id)}
            />
          ))}
        </div>

        {/* Selected summary */}
        {selectedAddOns.length > 0 && (
          <SelectedSummary count={selectedAddOns.length} />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4 mt-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        <div className="flex gap-3 ml-auto">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
          
          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors font-semibold"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Info note */}
      {selectedAddOns.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <p className="text-xs text-gray-600 text-center">
            Add-ons and detailed pricing will be provided in your custom quote.
          </p>
        </div>
      )}
    </div>
  )
}

