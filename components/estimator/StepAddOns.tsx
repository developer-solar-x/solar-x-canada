'use client'

// Step for selecting system type and additional products/services (add-ons)

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Zap, Wind, Home, Check } from 'lucide-react'

// No system-type selection here; first step already chose the program

// Available add-on options
const ADD_ONS = [
  {
    id: 'ev_charger',
    name: 'EV Charger',
    icon: Zap,
    description: 'Level 2 home charging station for electric vehicles'
  },
  {
    id: 'heat_pump',
    name: 'Heat Pump',
    icon: Wind,
    description: 'Energy-efficient heating and cooling system'
  },
  {
    id: 'new_roof',
    name: 'New Roof',
    icon: Home,
    description: 'New roof installation before solar panel mounting'
  },
  {
    id: 'water_heater',
    name: 'Water Heater',
    icon: Zap,
    description: 'High-efficiency water heating system'
  }
]

interface StepAddOnsProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

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
      {/* No system type UI here */}

      {/* Add-ons Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-navy-500 mb-3">
            Additional Add-Ons (Optional)
          </h3>
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
                </div>
              </div>
            </button>
          )
        })}
      </div>

        {/* Selected summary */}
        {selectedAddOns.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {selectedAddOns.length} add-on{selectedAddOns.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-gray-600">
                  We'll include these in your custom quote
                </p>
              </div>
            </div>
          </div>
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

