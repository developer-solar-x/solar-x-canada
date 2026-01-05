'use client'

import { Home } from 'lucide-react'
import { getDirectionLabel, getOrientationEfficiency, calculateRoofAzimuth } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'
import type { RoofSummaryProps } from '../types'

export function RoofSummary({ data }: RoofSummaryProps) {
  const hasMultipleSections = data.roofPolygon?.features && data.roofPolygon.features.length > 1

  return (
    <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Home className="text-blue-600 flex-shrink-0 mt-1" size={24} />
        <div className="flex-1">
          <h3 className="font-semibold text-navy-500 mb-2">Your Roof</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Area:</span>
              <span className="ml-2 font-bold text-navy-500">
                {data.roofAreaSqft.toLocaleString()} sq ft
              </span>
            </div>
            {hasMultipleSections && (
              <div>
                <span className="text-gray-600">Sections:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {data.roofPolygon.features.length} roof sections
                </span>
              </div>
            )}
          </div>
          
          {/* Section breakdown for multiple polygons */}
          {hasMultipleSections && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Section Details:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.roofPolygon.features.map((feature: any, index: number) => {
                  if (feature.geometry.type !== 'Polygon') return null
                  
                  // Use manually corrected orientation from roofSections if available
                  // Match by feature ID first, then fall back to index
                  let direction, efficiency, areaSqFt
                  
                  // Try to find matching section by ID or index
                  let matchingSection = null
                  if (data.roofSections && data.roofSections.length > 0) {
                    const featureId = feature.id || `section-${index + 1}`
                    matchingSection = data.roofSections.find((s: any) => s.id === featureId) || data.roofSections[index]
                  }
                  
                  if (matchingSection) {
                    // Use corrected data from user edits
                    direction = matchingSection.direction
                    efficiency = matchingSection.efficiency
                    areaSqFt = matchingSection.area
                  } else {
                    // Calculate from polygon (legacy or uncorrected)
                    const areaMeters = turf.area(feature)
                    areaSqFt = Math.round(areaMeters * 10.764)
                    const azimuth = calculateRoofAzimuth(feature)
                    direction = getDirectionLabel(azimuth)
                    efficiency = getOrientationEfficiency(azimuth)
                  }
                  
                  return (
                    <div key={index} className="text-xs bg-white/60 rounded px-2 py-1">
                      <span className="font-medium text-navy-500">Section {index + 1}:</span>
                      <span className="ml-1 text-gray-600">
                        {areaSqFt.toLocaleString()} sq ft • {direction} ({efficiency}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

