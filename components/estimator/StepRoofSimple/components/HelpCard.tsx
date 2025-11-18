'use client'

import type { HelpCardProps } from '../types'

export function HelpCard({}: HelpCardProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
      <h4 className="font-semibold text-navy-500 mb-2 text-sm">Not sure about your roof size?</h4>
      <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
        <li>Most single-story homes: 1,200-1,800 sq ft</li>
        <li>Most two-story homes: 1,500-2,500 sq ft</li>
        <li>Large homes: 2,500+ sq ft</li>
        <li>Don't worry - we'll verify during site visit</li>
      </ul>
    </div>
  )
}

