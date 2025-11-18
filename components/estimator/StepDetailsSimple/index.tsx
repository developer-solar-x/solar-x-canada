'use client'

// Easy Mode: Simplified Property Details

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { RoofTypeSelector } from './components/RoofTypeSelector'
import { RoofConditionSelector } from './components/RoofConditionSelector'
import { ShadeLevelSelector } from './components/ShadeLevelSelector'
import { RoofOrientationSelector } from './components/RoofOrientationSelector'
import { InfoBanner } from './components/InfoBanner'
import { UpgradePrompt } from './components/UpgradePrompt'
import type { StepDetailsSimpleProps } from './types'

export function StepDetailsSimple({ data, onComplete, onBack, onUpgradeMode }: StepDetailsSimpleProps) {
  const [roofType, setRoofType] = useState<string>(data.roofType || 'asphalt_shingle')
  const [roofCondition, setRoofCondition] = useState<string>(data.roofAge || '6-15')
  const [shadeLevel, setShadeLevel] = useState<string>(data.shadingLevel || 'minimal')
  const [roofOrientation, setRoofOrientation] = useState<number>(data.roofAzimuth || 180)

  const handleContinue = () => {
    onComplete({
      roofType,
      roofAge: roofCondition,
      shadingLevel: shadeLevel,
      roofPitch: 'medium', // Default for easy mode
      roofAzimuth: roofOrientation, // Include roof orientation
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            A Few Quick Questions
          </h2>
          <p className="text-gray-600">
            Help us understand your property better
          </p>
        </div>

        {/* Roof Type */}
        <RoofTypeSelector
          roofType={roofType}
          onRoofTypeChange={setRoofType}
        />

        {/* Roof Condition */}
        <RoofConditionSelector
          roofCondition={roofCondition}
          onRoofConditionChange={setRoofCondition}
        />

        {/* Shade Level */}
        <ShadeLevelSelector
          shadeLevel={shadeLevel}
          onShadeLevelChange={setShadeLevel}
        />

        {/* Roof Orientation */}
        <RoofOrientationSelector
          roofOrientation={roofOrientation}
          onRoofOrientationChange={setRoofOrientation}
        />

        {/* Info Banner */}
        <InfoBanner />

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <UpgradePrompt onUpgrade={onUpgradeMode} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
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
            className="btn-primary flex-1"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

