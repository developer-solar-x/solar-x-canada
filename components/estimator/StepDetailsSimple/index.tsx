'use client'

// Easy Mode: Simplified Property Details

import { useState } from 'react'
import { CheckCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { getOrientationEfficiency, getPitchEfficiency } from '@/lib/roof-calculations'
import { RoofTypeSelector } from './components/RoofTypeSelector'
import { RoofConditionSelector } from './components/RoofConditionSelector'
import { ShadeLevelSelector } from './components/ShadeLevelSelector'
import { RoofOrientationSelector } from './components/RoofOrientationSelector'
import { InfoBanner } from './components/InfoBanner'
import { UpgradePrompt } from './components/UpgradePrompt'
import type { StepDetailsSimpleProps } from './types'

export function StepDetailsSimple({ data, onComplete, onBack, onUpgradeMode }: StepDetailsSimpleProps) {
  // Program type and lead type are already selected in the initial modal
  // Use existing programType from data, don't override with default unless missing
  const programType = data.programType || 'hrs_residential'
  const leadType = data.leadType || 'residential'
  
  // Data flow tracing: Log province and programType to verify they're preserved
  if (process.env.NODE_ENV === 'development') {
    console.log('[StepDetailsSimple] Data flow trace:', {
      'data.programType': data.programType,
      'data.province': data.province,
      'programType (used)': programType,
      'data.leadType': data.leadType,
    })
  }
  
  const [roofType, setRoofType] = useState<string>(data.roofType || 'asphalt_shingle')
  const [roofCondition, setRoofCondition] = useState<string>(data.roofAge || '6-15')
  const [shadeLevel, setShadeLevel] = useState<string>(data.shadingLevel || 'minimal')
  const [roofOrientation, setRoofOrientation] = useState<number>(data.roofAzimuth || 180)
  const [showDeductionsSummary, setShowDeductionsSummary] = useState(false)

  // Calculate total deductions based on selections
  const OBSTRUCTION_ALLOWANCE = 0.90 // 10% reduction
  const usableRoofPercent: Record<string, number> = {
    'none': 0.90,
    'minimal': 0.80,
    'partial': 0.65,
    'significant': 0.50
  }
  
  const shadingPercent = usableRoofPercent[shadeLevel.toLowerCase()] || 0.80
  const shadingDeduction = (1 - shadingPercent) * 100
  const obstructionDeduction = (1 - OBSTRUCTION_ALLOWANCE) * 100
  
  // Total usable area deduction (obstructions + shading)
  const totalUsableAreaDeduction = (1 - (OBSTRUCTION_ALLOWANCE * shadingPercent)) * 100
  const usableAreaPercent = (OBSTRUCTION_ALLOWANCE * shadingPercent) * 100
  
  // Production efficiency based on orientation and pitch
  const orientationEfficiency = getOrientationEfficiency(roofOrientation)
  const pitchEfficiency = getPitchEfficiency('medium') // Easy mode defaults to medium pitch
  
  // Combined production efficiency (orientation × pitch)
  const productionEfficiency = Math.round((orientationEfficiency / 100) * (pitchEfficiency / 100) * 100 * 100) / 100

  const handleContinue = () => {
    // Preserve province and other data fields when completing step
    const stepData: any = {
      programType,
      leadType,
      roofType,
      roofAge: roofCondition,
      shadingLevel: shadeLevel,
      roofPitch: 'medium', // Default for easy mode
      roofAzimuth: roofOrientation, // Include roof orientation
    }
    
    // Data flow tracing: Log what we're passing up
    if (process.env.NODE_ENV === 'development') {
      console.log('[StepDetailsSimple] Completing step with data:', {
        programType: stepData.programType,
        province: data.province,
        'Note': 'province should be preserved by parent handler',
      })
    }
    
    onComplete(stepData)
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

        {/* Total Deductions Summary - Collapsible */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-navy-50 border-2 border-blue-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDeductionsSummary(!showDeductionsSummary)}
            className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Calculator className="text-white" size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-navy-500">Total Deductions Summary</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {usableAreaPercent.toFixed(2)}% usable area • {totalUsableAreaDeduction.toFixed(2)}% total deduction
                </p>
              </div>
            </div>
            {showDeductionsSummary ? (
              <ChevronUp className="text-navy-500" size={20} />
            ) : (
              <ChevronDown className="text-navy-500" size={20} />
            )}
          </button>
          
          {showDeductionsSummary && (
            <div className="px-4 pb-4 pt-2 border-t border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Usable Roof Area:</span>
                  <span className="font-semibold text-navy-600">{usableAreaPercent.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>• After obstructions (10%):</span>
                    <span>{(OBSTRUCTION_ALLOWANCE * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• After shading ({shadeLevel}, {shadingDeduction.toFixed(2)}%):</span>
                    <span>{(shadingPercent * 100).toFixed(2)}%</span>
                  </div>
                  <div className="text-gray-500 italic pt-1">
                    Calculation: {OBSTRUCTION_ALLOWANCE.toFixed(2)} × {shadingPercent.toFixed(2)} = {usableAreaPercent.toFixed(2)}%
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-gray-700">Total Deduction:</span>
                  <span className="font-bold text-red-600">{totalUsableAreaDeduction.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-gray-700">Production Efficiency:</span>
                  <span className="font-semibold text-green-600">{productionEfficiency.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>• Orientation:</span>
                    <span>{orientationEfficiency.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Roof Pitch (medium):</span>
                    <span>{pitchEfficiency.toFixed(2)}%</span>
                  </div>
                  <div className="text-gray-500 italic pt-1">
                    Combined: {orientationEfficiency.toFixed(2)}% × {pitchEfficiency.toFixed(2)}% = {productionEfficiency.toFixed(2)}%
                  </div>
                </div>
                {data.roofAreaSqft && (
                  <div className="pt-2 border-t border-blue-200 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Roof area:</span>
                      <span>{Math.round(data.roofAreaSqft).toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Usable area (after deductions):</span>
                      <span className="font-semibold">{Math.round(data.roofAreaSqft * (usableAreaPercent / 100)).toLocaleString()} sq ft</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

