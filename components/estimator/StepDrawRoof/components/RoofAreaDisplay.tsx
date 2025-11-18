'use client'

import { Ruler } from 'lucide-react'
import type { RoofAreaDisplayProps } from '../types'

export function RoofAreaDisplay({ roofArea, estimatedPanels, roofPolygon }: RoofAreaDisplayProps) {
  return (
    <>
      <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-200">
        <div className="flex items-center gap-3 mb-2">
          <Ruler className="text-red-500" size={24} />
          <span className="text-sm font-medium text-gray-600">Roof Area</span>
        </div>
        <div className="text-3xl font-bold text-red-500">
          {roofArea.toLocaleString()} sq ft
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-gray-600 mb-2">
          Estimated Panel Capacity
        </div>
        <div className="text-2xl font-bold text-blue-500">
          ~{estimatedPanels} panels
        </div>
        {roofPolygon?.features?.length > 1 && (
          <div className="text-xs text-blue-600 mt-1">
            {roofPolygon.features.length} roof sections
          </div>
        )}
      </div>
    </>
  )
}

