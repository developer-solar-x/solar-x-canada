'use client'

// Step for selecting system type and additional products/services (add-ons)

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Zap, Wind, Home, Check, Battery, Grid } from 'lucide-react'

// System type options
const SYSTEM_TYPES = [
  {
    id: 'grid_tied',
    name: 'Grid-Tied System',
    icon: Grid,
    description: 'Connected to the utility grid with net metering',
    details: 'Excess solar energy is exported to the grid for credits. Lower upfront cost.',
    recommended: 'Best for most homes'
  },
  {
    id: 'battery_system',
    name: 'Battery System',
    icon: Battery,
    description: 'Energy storage for peak shaving and backup power',
    details: 'Store energy during cheap hours, use during peak times. Maximum savings with time-of-use rates.',
    recommended: 'Best for reducing bills'
  }
]

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
  // Initialize system type and add-ons
  const [systemType, setSystemType] = useState<string>(data.systemType || 'grid_tied')
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
    onComplete({
      systemType,
      selectedAddOns,
      // Add battery flag based on system type for backward compatibility
      hasBattery: systemType === 'battery_system'
    })
  }

  // Handle skip (no add-ons selected but system type is required)
  const handleSkip = () => {
    onComplete({
      systemType,
      selectedAddOns: [],
      hasBattery: systemType === 'battery_system'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* System Type Selection */}
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-navy-500 mb-3">
            Choose Your System Type
          </h2>
          <p className="text-gray-600 mb-2">
            Select the type of solar system that best fits your needs and energy goals.
          </p>
          <p className="text-sm text-gray-500 italic">
            Click on either option to select. You can switch between them at any time.
          </p>
        </div>

        {/* System type cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {SYSTEM_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = systemType === type.id
            
            return (
              <button
                key={type.id}
                onClick={() => setSystemType(type.id)}
                className={`relative p-6 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-red-500 bg-red-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-lg hover:scale-105'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${
                  isSelected ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <Icon size={28} className={isSelected ? 'text-red-600' : 'text-gray-600'} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-navy-500 mb-2">
                  {type.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {type.description}
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  {type.details}
                </p>
                
                {/* Recommended badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  isSelected ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {type.recommended}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add-ons Section */}
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-navy-500 mb-3">
            Additional Add-Ons (Optional)
          </h3>
          <p className="text-gray-600">
            Enhance your home energy efficiency with these additional products and services.
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
                  <p className="text-sm text-gray-600">
                    {addOn.description}
                  </p>
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
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <p className="text-sm text-gray-700 text-center">
          <strong>System Type:</strong> {systemType === 'grid_tied' ? 'Grid-Tied System' : 'Battery System'} selected
        </p>
        {selectedAddOns.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Add-ons and detailed pricing will be provided in your custom quote.
          </p>
        )}
      </div>
    </div>
  )
}

