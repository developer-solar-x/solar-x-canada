'use client'

// Step 2: Property Info
// Roof size preset, shading level, and roof orientation

import { useState } from 'react'
import { 
  Home, 
  Sun, 
  Compass, 
  HomeIcon, 
  Building2, 
  Building, 
  Castle,
  SunIcon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Square
} from 'lucide-react'
import type { QuickEstimateData } from '@/app/quick-estimate/page'

interface StepPropertyInfoProps {
  data: QuickEstimateData
  onComplete: (data: Partial<QuickEstimateData>) => void
  onBack?: () => void
}

const ROOF_SIZE_PRESETS = [
  { id: 'small', label: 'Small', description: '< 1,000 sq ft', sqft: 800, Icon: HomeIcon },
  { id: 'medium', label: 'Medium', description: '1,000 - 1,500 sq ft', sqft: 1250, Icon: Building2 },
  { id: 'large', label: 'Large', description: '1,500 - 2,500 sq ft', sqft: 2000, Icon: Building },
  { id: 'xlarge', label: 'X-Large', description: '> 2,500 sq ft', sqft: 3000, Icon: Castle },
]

const SHADING_LEVELS = [
  { id: 'none', label: 'No Shade', description: 'Full sun all day', Icon: SunIcon, factor: 1.0 },
  { id: 'light', label: 'Light Shade', description: 'Some trees nearby', Icon: Cloud, factor: 0.9 },
  { id: 'moderate', label: 'Moderate Shade', description: 'Partial shading', Icon: CloudDrizzle, factor: 0.75 },
  { id: 'heavy', label: 'Heavy Shade', description: 'Significant coverage', Icon: CloudRain, factor: 0.5 },
]

const ROOF_ORIENTATIONS = [
  { id: 'south', label: 'South', azimuth: 180, Icon: ArrowDown, optimal: true },
  { id: 'east', label: 'East', azimuth: 90, Icon: ArrowRight, optimal: false },
  { id: 'west', label: 'West', azimuth: 270, Icon: ArrowLeft, optimal: false },
  { id: 'flat', label: 'Flat', azimuth: 180, Icon: Square, optimal: true },
]

export function StepPropertyInfo({ data, onComplete, onBack }: StepPropertyInfoProps) {
  const [roofSize, setRoofSize] = useState<string>(data.roofSizePreset || '')
  const [shading, setShading] = useState<string>(data.shadingLevel || '')
  const [orientation, setOrientation] = useState<string>(data.roofOrientation || 'south')

  const handleContinue = () => {
    const selectedRoof = ROOF_SIZE_PRESETS.find(r => r.id === roofSize)
    const selectedOrientation = ROOF_ORIENTATIONS.find(o => o.id === orientation)

    onComplete({
      roofSizePreset: roofSize,
      roofAreaSqft: selectedRoof?.sqft,
      shadingLevel: shading as QuickEstimateData['shadingLevel'],
      roofOrientation: orientation as QuickEstimateData['roofOrientation'],
      roofAzimuth: selectedOrientation?.azimuth || 180,
    })
  }

  const isValid = roofSize && shading && orientation

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">
            Property Details
          </h1>
          <p className="text-gray-600">
            Help us estimate your roof's solar potential
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Roof Size */}
          <div>
            <h3 className="text-lg font-semibold text-navy-500 mb-1 flex items-center gap-2">
              <Home size={20} />
              Approximate Roof Size
            </h3>
            <p className="text-sm text-gray-500 mb-4">Select the closest match for your home</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROOF_SIZE_PRESETS.map((preset) => {
                const IconComponent = preset.Icon
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setRoofSize(preset.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      roofSize === preset.id
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <IconComponent 
                        size={32} 
                        className={roofSize === preset.id ? 'text-red-600' : 'text-gray-600'} 
                      />
                    </div>
                    <span className="font-semibold text-navy-500 block">{preset.label}</span>
                    <span className="text-xs text-gray-500">{preset.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Shading Level */}
          <div>
            <h3 className="text-lg font-semibold text-navy-500 mb-1 flex items-center gap-2">
              <Sun size={20} />
              Roof Shading
            </h3>
            <p className="text-sm text-gray-500 mb-4">How much shade does your roof typically get?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SHADING_LEVELS.map((level) => {
                const IconComponent = level.Icon
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setShading(level.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      shading === level.id
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      <IconComponent 
                        size={32} 
                        className={shading === level.id ? 'text-red-600' : 'text-gray-600'} 
                      />
                    </div>
                    <span className="font-semibold text-navy-500 block">{level.label}</span>
                    <span className="text-xs text-gray-500">{level.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Roof Orientation */}
          <div>
            <h3 className="text-lg font-semibold text-navy-500 mb-1 flex items-center gap-2">
              <Compass size={20} />
              Roof Orientation
            </h3>
            <p className="text-sm text-gray-500 mb-4">Which direction does your main roof face?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROOF_ORIENTATIONS.map((orient) => {
                const IconComponent = orient.Icon
                return (
                  <button
                    key={orient.id}
                    type="button"
                    onClick={() => setOrientation(orient.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center relative ${
                      orientation === orient.id
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {orient.optimal && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Best
                      </span>
                    )}
                    <div className="flex justify-center mb-2">
                      <IconComponent 
                        size={32} 
                        className={orientation === orient.id ? 'text-red-600' : 'text-gray-600'} 
                      />
                    </div>
                    <span className="font-semibold text-navy-500 block">{orient.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Don't worry if you're not sure about exact measurements.
              We'll verify everything when you request a detailed quote.
            </p>
          </div>

          {/* Action Buttons */}
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
              type="button"
              onClick={handleContinue}
              disabled={!isValid}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              See My Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
