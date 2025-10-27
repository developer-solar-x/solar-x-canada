'use client'

// Step for selecting additional products/services (add-ons)

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Zap, Wind, Home, Check } from 'lucide-react'

// Available add-on options
const ADD_ONS = [
  {
    id: 'ev_charger',
    name: 'EV Charger',
    icon: Zap,
    description: 'Level 2 home charging station for electric vehicles',
    estimatedCost: 1500,
    popular: true
  },
  {
    id: 'heat_pump',
    name: 'Heat Pump',
    icon: Wind,
    description: 'Energy-efficient heating and cooling system',
    estimatedCost: 8000,
    popular: true
  },
  {
    id: 'roof_replacement',
    name: 'Roof Replacement',
    icon: Home,
    description: 'New roof installation before solar panel mounting',
    estimatedCost: 12000,
    popular: false
  }
]

interface StepAddOnsProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepAddOns({ data, onComplete, onBack }: StepAddOnsProps) {
  // Initialize with previously selected add-ons if any
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

  // Calculate total estimated cost of selected add-ons
  const totalAddOnsCost = ADD_ONS
    .filter(addOn => selectedAddOns.includes(addOn.id))
    .reduce((sum, addOn) => sum + addOn.estimatedCost, 0)

  // Handle continue
  const handleContinue = () => {
    onComplete({
      selectedAddOns,
      addOnsCost: totalAddOnsCost
    })
  }

  // Handle skip (no add-ons selected)
  const handleSkip = () => {
    onComplete({
      selectedAddOns: [],
      addOnsCost: 0
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-navy-500 mb-3">
          Interested in Add-Ons?
        </h2>
        <p className="text-gray-600">
          Enhance your home energy efficiency with these additional products and services.
          Select any that interest you for a combined quote.
        </p>
      </div>

      {/* Add-ons grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {ADD_ONS.map((addOn) => {
          const Icon = addOn.icon
          const isSelected = selectedAddOns.includes(addOn.id)
          
          return (
            <button
              key={addOn.id}
              onClick={() => toggleAddOn(addOn.id)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-red-500 bg-red-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Popular badge */}
              {addOn.popular && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                  POPULAR
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1">
                  <Check size={16} />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  isSelected ? 'bg-red-500' : 'bg-gray-100'
                }`}>
                  <Icon 
                    size={32} 
                    className={isSelected ? 'text-white' : 'text-gray-600'} 
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-navy-500 mb-1">
                    {addOn.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {addOn.description}
                  </p>
                  <div className="text-lg font-bold text-red-500">
                    Est. ${addOn.estimatedCost.toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected summary */}
      {selectedAddOns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {selectedAddOns.length} add-on{selectedAddOns.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-600">
                Combined with your solar estimate
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalAddOnsCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

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
      <p className="text-xs text-gray-500 text-center mt-6">
        Estimated costs are approximate and will be refined in your final quote.
      </p>
    </div>
  )
}

