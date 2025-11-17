'use client'

import { Building, Gauge, Droplets, Compass, Sun, Calendar } from 'lucide-react'
import { calculateRoofAzimuth, getDirectionLabel, getOrientationEfficiency } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'

interface RoofSummaryProps {
  roofAreaSqft: number
  roofType?: string
  roofPitch?: string
  shadingLevel?: string
  roofAge?: string
  roofPolygon?: any
  roofSections?: any[]
}

export function RoofSummary({
  roofAreaSqft,
  roofType,
  roofPitch,
  shadingLevel,
  roofAge,
  roofPolygon,
  roofSections,
}: RoofSummaryProps) {
  return (
    <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-red-500 rounded-lg">
          <Building className="text-white" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-navy-500 mb-0.5">Roof Details</h3>
          <p className="text-xs text-gray-600">Analyzed roof specifications</p>
        </div>
      </div>

      {/* Main roof stats */}
      <div className="space-y-3 mb-4">
        {/* Total Area - Prominent */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-red-500" />
              <span className="text-sm font-semibold text-gray-700">Total Area</span>
            </div>
            <span className="text-xl font-bold text-red-500">
              {roofAreaSqft?.toLocaleString()} <span className="text-sm">sq ft</span>
            </span>
          </div>
        </div>

        {/* Roof specifications grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets size={14} className="text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">Type</span>
            </div>
            <p className="text-sm font-semibold text-navy-500">
              {roofType || 'Asphalt Shingle'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Compass size={14} className="text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">Pitch</span>
            </div>
            <p className="text-sm font-semibold text-navy-500">
              {roofPitch || 'Medium'}
            </p>
          </div>

          {shadingLevel && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sun size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Shading</span>
                </div>
                <p className="text-sm font-semibold text-navy-500 capitalize">
                  {shadingLevel}
                </p>
              </div>

              {roofAge && (
                <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-600 font-medium">Age</span>
                  </div>
                  <p className="text-sm font-semibold text-navy-500">
                    {roofAge}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section count badge */}
      {roofPolygon?.features && roofPolygon.features.length > 1 && (
        <div className="bg-navy-500 text-white rounded-lg p-2.5 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Multiple Sections</span>
            <span className="text-lg font-bold">
              {roofPolygon.features.length}
            </span>
          </div>
        </div>
      )}
      
      {/* Multi-section breakdown */}
      {roofPolygon?.features && roofPolygon.features.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <Compass size={12} className="text-red-500" />
            Section Analysis
          </p>
          <div className="space-y-2">
            {roofPolygon.features.map((feature: any, index: number) => {
              if (feature.geometry.type !== 'Polygon') return null
              
              // Use manually corrected orientation from roofSections if available
              // Otherwise calculate from polygon geometry
              let azimuth, direction, efficiency, areaSqFt
              
              if (roofSections && roofSections[index]) {
                // Use corrected data from user edits
                const section = roofSections[index]
                azimuth = section.azimuth
                direction = section.direction
                efficiency = section.efficiency
                areaSqFt = section.area
              } else {
                // Calculate from polygon (legacy or uncorrected)
                const areaMeters = turf.area(feature)
                areaSqFt = Math.round(areaMeters * 10.764)
                azimuth = calculateRoofAzimuth(feature)
                direction = getDirectionLabel(azimuth)
                efficiency = getOrientationEfficiency(azimuth)
              }
              
              // Color based on efficiency - using brand colors
              const efficiencyColor = efficiency >= 90 ? 'text-navy-500' : 
                                     efficiency >= 70 ? 'text-gray-700' : 'text-red-500'
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      Section {index + 1}
                    </span>
                    <span className="text-xs font-bold text-navy-500">
                      {areaSqFt.toLocaleString()} sq ft
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Compass size={10} />
                      {direction}
                    </span>
                    <span className={`text-xs font-bold ${efficiencyColor}`}>
                      {efficiency}% efficiency
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

