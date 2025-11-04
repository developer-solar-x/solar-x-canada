'use client'

// Easy Mode: Simple Roof Size Input

import { useState } from 'react'
import { Home, Ruler, ArrowRight } from 'lucide-react'

interface StepRoofSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

const ROOF_SIZE_PRESETS = [
  { id: 'small', label: 'Small', range: '< 1,000 sq ft', sqft: 800 },
  { id: 'medium', label: 'Medium', range: '1,000 - 2,000 sq ft', sqft: 1500 },
  { id: 'large', label: 'Large', range: '2,000 - 3,000 sq ft', sqft: 2500 },
  { id: 'xlarge', label: 'Very Large', range: '> 3,000 sq ft', sqft: 3500 },
]

export function StepRoofSimple({ data, onComplete, onBack, onUpgradeMode }: StepRoofSimpleProps) {
  const [selectedSize, setSelectedSize] = useState<string>(data.roofSizePreset || '')
  const [customSize, setCustomSize] = useState<string>(data.roofAreaSqft?.toString() || '')
  const [useCustom, setUseCustom] = useState(!!data.roofAreaSqft && !data.roofSizePreset)

  const handleContinue = () => {
    if (useCustom && customSize) {
      onComplete({
        roofAreaSqft: parseInt(customSize),
        roofSizePreset: null,
        roofEntryMethod: 'manual',
      })
    } else if (selectedSize) {
      const preset = ROOF_SIZE_PRESETS.find(p => p.id === selectedSize)
      onComplete({
        roofAreaSqft: preset?.sqft,
        roofSizePreset: selectedSize,
        roofEntryMethod: 'preset',
      })
    }
  }

  const canContinue = useCustom ? !!customSize && parseInt(customSize) > 0 : !!selectedSize

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-0">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Home className="text-white" size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-500 mb-1 sm:mb-2">
            Roof Size
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Approximate size is fine - we'll verify later
          </p>
        </div>

        {/* Preset Size Options */}
        {!useCustom && (
          <div className="space-y-3 sm:space-y-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Select approximate roof size:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {ROOF_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedSize(preset.id)}
                  className={`p-4 sm:p-5 border-2 rounded-xl transition-all text-left ${
                    selectedSize === preset.id
                      ? 'border-red-500 bg-red-50 shadow-[0_2px_10px_rgba(255,59,48,0.08)]'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="font-semibold text-navy-500 text-base sm:text-lg">{preset.label}</div>
                  <div className="text-sm text-gray-600">{preset.range}</div>
                  <div className="text-xs text-gray-500 mt-1">~{preset.sqft.toLocaleString()} sq ft</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Size Input */}
        {useCustom && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter exact roof size:
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="e.g., 1500"
                className="w-full pl-10 pr-20 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base sm:text-lg"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                sq ft
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Find this on property documents or make your best estimate
            </p>
          </div>
        )}

        {/* Toggle between preset and custom */}
        <div className="text-center mb-6 sm:mb-8">
          <button
            onClick={() => {
              setUseCustom(!useCustom)
              setSelectedSize('')
              setCustomSize('')
            }}
            className="text-sm sm:text-base text-blue-600 hover:underline"
          >
            {useCustom ? 'Use size presets instead' : 'Enter exact size instead'}
          </button>
        </div>

        {/* Help Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
          <h4 className="font-semibold text-navy-500 mb-2 text-sm">Not sure about your roof size?</h4>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>Most single-story homes: 1,200-1,800 sq ft</li>
            <li>Most two-story homes: 1,500-2,500 sq ft</li>
            <li>Large homes: 2,500+ sq ft</li>
            <li>Don't worry - we'll verify during site visit</li>
          </ul>
        </div>

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-navy-500 mb-1 text-sm">Want more accuracy?</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Switch to detailed mode to draw your exact roof on a satellite map
                </p>
                <button
                  onClick={onUpgradeMode}
                  className="text-sm text-navy-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Draw on Map Instead
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sm:flex sm:gap-4 fixed sm:static left-0 right-0 bottom-0 sm:bottom-auto z-40 bg-white sm:bg-transparent p-3 sm:p-0 border-t sm:border-0 shadow-[0_-4px_18px_rgba(0,0,0,0.06)] sm:shadow-none">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 flex-1"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

