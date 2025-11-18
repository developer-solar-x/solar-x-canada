'use client'

import { Trash2 } from 'lucide-react'
import type { ApplianceRowProps } from '../types'

export function ApplianceRow({ appliance, onUpdate, onRemove }: ApplianceRowProps) {
  const dailyKwh = ((appliance.wattage * appliance.hoursPerDay * appliance.quantity) / 1000) || 0

  return (
    <tr className={`border-b border-gray-100 group hover:bg-gray-50 ${appliance.quantity === 0 ? 'opacity-50' : ''}`}>
      <td className="py-3 px-2">
        <div className="font-medium text-gray-800 text-sm">{appliance.name}</div>
      </td>
      <td className="py-3 px-2">
        <input
          type="number"
          min="0"
          max="99"
          value={appliance.quantity}
          onChange={(e) => onUpdate('quantity', parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </td>
      <td className="py-3 px-2">
        <input
          type="number"
          min="0"
          value={appliance.wattage}
          onChange={(e) => onUpdate('wattage', parseInt(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </td>
      <td className="py-3 px-2">
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={appliance.hoursPerDay}
          onChange={(e) => onUpdate('hoursPerDay', parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </td>
      <td className="py-3 px-2 text-right">
        <span className="font-semibold text-navy-500 text-sm">
          {dailyKwh.toFixed(2)} kWh
        </span>
      </td>
      <td className="py-3 px-2 text-right">
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove appliance"
          title="Delete this appliance"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}

