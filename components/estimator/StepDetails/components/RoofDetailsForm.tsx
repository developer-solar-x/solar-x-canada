'use client'

import { useState } from 'react'
import { Info, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { ROOF_ORIENTATIONS, getDirectionLabel, getOrientationEfficiency, getPitchEfficiency } from '@/lib/roof-calculations'
import type { RoofDetailsFormProps } from '../types'

export function RoofDetailsForm({ formData, setFormData, data }: RoofDetailsFormProps) {
  const hasMultipleSections = data.roofPolygon?.features && data.roofPolygon.features.length > 1
  const [showDeductionsSummary, setShowDeductionsSummary] = useState(false)

  // Calculate total deductions based on selections
  const OBSTRUCTION_ALLOWANCE = 0.90 // 10% reduction
  const usableRoofPercent: Record<string, number> = {
    'none': 0.90,
    'minimal': 0.80,
    'partial': 0.65,
    'significant': 0.50
  }
  
  const shadingPercent = usableRoofPercent[formData.shadingLevel.toLowerCase()] || 0.80
  const shadingDeduction = (1 - shadingPercent) * 100
  const obstructionDeduction = (1 - OBSTRUCTION_ALLOWANCE) * 100
  
  // Total usable area deduction (obstructions + shading)
  // Formula: 1 - (0.90 * shadingPercent) = total deduction
  const totalUsableAreaDeduction = (1 - (OBSTRUCTION_ALLOWANCE * shadingPercent)) * 100
  const usableAreaPercent = (OBSTRUCTION_ALLOWANCE * shadingPercent) * 100
  
  // Production efficiency based on orientation and pitch
  const currentAzimuth = formData.roofAzimuth || data.roofAzimuth || 180
  const orientationEfficiency = getOrientationEfficiency(currentAzimuth)
  const pitchEfficiency = getPitchEfficiency(formData.roofPitch)
  
  // Combined production efficiency (orientation × pitch)
  // Both factors affect production, so we multiply them (normalized to 100% base)
  const productionEfficiency = Math.round((orientationEfficiency / 100) * (pitchEfficiency / 100) * 100 * 100) / 100

  return (
    <div>
      <h3 className="text-xl font-semibold text-navy-500 mb-4">Roof Information</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Roof Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Roof Type
          </label>
          <select
            value={formData.roofType}
            onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="asphalt_shingle">Shingles</option>
            <option value="metal">Metal</option>
            <option value="flat">Flat</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Roof Age */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Roof Age
          </label>
          <select
            value={formData.roofAge}
            onChange={(e) => setFormData({ ...formData, roofAge: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="0-5">0-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="11-20">11-20 years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>

        {/* Roof Pitch */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Roof Pitch
            </label>
            <div className="relative group">
              <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={18} />
              <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                <div className="font-semibold mb-1">Production Efficiency</div>
                <div>Roof pitch affects solar panel tilt angle and production efficiency. Optimal is 30-40° for maximum year-round production.</div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <select
            value={formData.roofPitch}
            onChange={(e) => setFormData({ ...formData, roofPitch: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="flat">Flat (0-10°)</option>
            <option value="low">Low (10-20°)</option>
            <option value="medium">Medium (20-40°)</option>
            <option value="steep">Steep (40°+)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Not sure? Choose 'Medium' - we'll verify during site visit
          </p>
        </div>

        {/* Shading */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Shading Level
            </label>
            <div className="relative group">
              <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={18} />
              <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                <div className="font-semibold mb-2">Usable Roof Area Deductions</div>
                <div className="space-y-1">
                  <div><strong>None:</strong> ~19% total deduction (10% obstructions + 10% shading)</div>
                  <div><strong>Minimal:</strong> ~28% total deduction (10% obstructions + 20% shading)</div>
                  <div><strong>Partial:</strong> ~41.5% total deduction (10% obstructions + 35% shading)</div>
                  <div><strong>Significant:</strong> ~55% total deduction (10% obstructions + 50% shading)</div>
                </div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <select
            value={formData.shadingLevel}
            onChange={(e) => setFormData({ ...formData, shadingLevel: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="none">None (Full sun all day)</option>
            <option value="minimal">Minimal (Mostly sunny)</option>
            <option value="partial">Partial (Some shade)</option>
            <option value="significant">Significant (Heavy shade)</option>
          </select>
        </div>
        
        {/* Snow Loss (Alberta only) */}
        {data.province && (data.province.toUpperCase() === 'AB' || data.province.toUpperCase() === 'ALBERTA' || data.province.toUpperCase().includes('ALBERTA')) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Winter Snow Loss (Alberta)
              </label>
              <div className="relative group">
                <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={18} />
                <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                  <div className="font-semibold mb-1">Alberta Winter Impact</div>
                  <div>Snow accumulation in winter months (Oct-Mar) reduces solar production by 3-5% annually. Typical clearing assumes occasional snow removal.</div>
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <select
              value={formData.snowLossFactor || 0.03}
              onChange={(e) => setFormData({ ...formData, snowLossFactor: Number(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            >
              <option value={0.03}>Typical clearing (3% loss)</option>
              <option value={0.05}>Minimal clearing (5% loss)</option>
              <option value={0}>No snow impact (0% loss)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Most Alberta homes: 3% loss. Remote/hard to access: 5% loss.
            </p>
          </div>
        )}
      </div>

      {/* Roof Orientation - only show if not already detected from polygon AND single section */}
      {!data.roofAzimuth && !hasMultipleSections && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Roof Orientation (Direction it Faces)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Which direction does your roof face? This affects solar production.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROOF_ORIENTATIONS.map((orientation) => (
              <button
                key={orientation.value}
                type="button"
                onClick={() => setFormData({ ...formData, roofAzimuth: orientation.azimuth })}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.roofAzimuth === orientation.azimuth
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">{orientation.icon}</div>
                <div className="font-semibold text-xs">{orientation.label}</div>
                <div className="text-xs text-gray-600">{orientation.efficiency}%</div>
                {orientation.value === 'south' && (
                  <div className="text-xs text-green-600 mt-1 font-medium">Best</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show detected orientation if available AND single section */}
      {data.roofAzimuth && !hasMultipleSections && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-navy-500">
                Roof Orientation: {getDirectionLabel(data.roofAzimuth)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Detected from your roof drawing. {getOrientationEfficiency(data.roofAzimuth)}% of optimal production.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Info note for multiple sections */}
      {hasMultipleSections && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="text-gray-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-gray-600">
              Each roof section has its own orientation which has been automatically detected and is shown in the summary above. 
              The solar estimate will account for all sections and their individual orientations.
            </p>
          </div>
        </div>
      )}

      {/* Total Deductions Summary - Collapsible */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-navy-50 border-2 border-blue-200 rounded-lg overflow-hidden">
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
                  <span>• After shading ({formData.shadingLevel}, {shadingDeduction.toFixed(2)}%):</span>
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
              {!hasMultipleSections && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-gray-700">Production Efficiency:</span>
                    <span className="font-semibold text-green-600">{productionEfficiency.toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>• Orientation ({getDirectionLabel(currentAzimuth)}):</span>
                      <span>{orientationEfficiency.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Roof Pitch ({formData.roofPitch}):</span>
                      <span>{pitchEfficiency.toFixed(2)}%</span>
                    </div>
                    <div className="text-gray-500 italic pt-1">
                      Combined: {orientationEfficiency.toFixed(2)}% × {pitchEfficiency.toFixed(2)}% = {productionEfficiency.toFixed(2)}%
                    </div>
                  </div>
                </>
              )}
              {data.roofAreaSqft && (
                <div className="pt-2 border-t border-blue-200 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Drawn roof area:</span>
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
    </div>
  )
}

