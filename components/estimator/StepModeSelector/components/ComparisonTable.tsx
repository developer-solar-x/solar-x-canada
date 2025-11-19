'use client'

import type { ComparisonTableProps } from '../types'

export function ComparisonTable({}: ComparisonTableProps) {
  return (
    <div className="mt-12 card p-6">
      <h3 className="font-bold text-navy-500 mb-4 text-center">Quick Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-600 font-semibold">Feature</th>
              <th className="text-center py-2 text-red-600 font-semibold">Quick Estimate</th>
              <th className="text-center py-2 text-navy-600 font-semibold">Detailed Analysis</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-b border-gray-100">
              <td className="py-3">Time Required</td>
              <td className="text-center text-red-600 font-semibold">3-5 min</td>
              <td className="text-center text-navy-600">10-15 min</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">Roof Input</td>
              <td className="text-center">Preset size selection</td>
              <td className="text-center">Interactive satellite map drawing</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">Energy Entry</td>
              <td className="text-center">Monthly bill input</td>
              <td className="text-center">Property details & monthly bill</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">Program Selection</td>
              <td className="text-center">In Details step</td>
              <td className="text-center">In Details step</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">Battery Peak Shaving</td>
              <td className="text-center">Available (if selected)</td>
              <td className="text-center">Available (if selected)</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">Photos</td>
              <td className="text-center">Simple (2-3 photos)</td>
              <td className="text-center">Organized categories (up to 17)</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3">System Accuracy</td>
              <td className="text-center">±15-20%</td>
              <td className="text-center">±5-10%</td>
            </tr>
            <tr>
              <td className="py-3">Best For</td>
              <td className="text-center">Quick estimates, browsing</td>
              <td className="text-center">Accurate quotes, detailed analysis</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

