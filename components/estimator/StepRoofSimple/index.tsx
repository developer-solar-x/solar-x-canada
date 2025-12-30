'use client'

// Easy Mode: Simple Roof Size Input

import { useState } from 'react'
import { Home } from 'lucide-react'
import { RoofSizePresets } from './components/RoofSizePresets'
import { CustomSizeInput } from './components/CustomSizeInput'
import { HelpCard } from './components/HelpCard'
import { UpgradePrompt } from './components/UpgradePrompt'
import { ROOF_SIZE_PRESETS } from './constants'
import type { StepRoofSimpleProps } from './types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export function StepRoofSimple({ data, onComplete, onBack, onUpgradeMode }: StepRoofSimpleProps) {
  const [selectedSize, setSelectedSize] = useState<string>(data.roofSizePreset || '')
  const [customSize, setCustomSize] = useState<string>(data.roofAreaSqft?.toString() || '')
  const [useCustom, setUseCustom] = useState(!!data.roofAreaSqft && !data.roofSizePreset)

  const handleContinue = () => {
    // Data flow tracing: Verify province and programType are preserved
    if (process.env.NODE_ENV === 'development') {
      console.log('[StepRoofSimple] Data flow trace:', {
        'data.province': data.province,
        'data.programType': data.programType,
        'Note': 'province and programType should be preserved by parent handler',
      })
    }
    
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
          <RoofSizePresets
            presets={ROOF_SIZE_PRESETS}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
          />
        )}

        {/* Custom Size Input */}
        {useCustom && (
          <CustomSizeInput
            customSize={customSize}
            onCustomSizeChange={setCustomSize}
          />
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
        <HelpCard />

        {/* User data accuracy disclaimer */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
          <InfoTooltip
            content="Roof size and layout are estimated values only. Incorrect or approximate measurements—such as roof area, usable sections, or obstructions—will affect system sizing and the accuracy of the estimates."
          />
          <span>Approximate roof size and layout will influence system sizing and estimate accuracy.</span>
        </div>

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <UpgradePrompt onUpgrade={onUpgradeMode} />
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

