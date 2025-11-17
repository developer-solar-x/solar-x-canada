'use client'

import { Leaf } from 'lucide-react'

interface EnvironmentalTabProps {
  co2OffsetTonsPerYear: number
  treesEquivalent: number
  carsOffRoadEquivalent: number
}

export function EnvironmentalTab({
  co2OffsetTonsPerYear,
  treesEquivalent,
  carsOffRoadEquivalent,
}: EnvironmentalTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex items-start gap-4">
          <Leaf className="text-green-600 flex-shrink-0" size={40} />
          <div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {co2OffsetTonsPerYear} tons
            </div>
            <div className="text-sm text-gray-600">CO₂ offset per year</div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">🌲</span>
          <div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {treesEquivalent}
            </div>
            <div className="text-sm text-gray-600">Trees planted equivalent</div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">🚗</span>
          <div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {carsOffRoadEquivalent}
            </div>
            <div className="text-sm text-gray-600">Cars off road equivalent</div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">♻️</span>
          <div>
            <div className="text-sm text-gray-600 mb-1">Supports renewable energy grid</div>
            <div className="text-xs text-gray-500">Contributes to Ontario's clean energy goals</div>
          </div>
        </div>
      </div>
    </div>
  )
}

