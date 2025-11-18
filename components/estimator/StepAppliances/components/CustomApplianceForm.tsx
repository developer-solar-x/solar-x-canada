'use client'

import { Plus } from 'lucide-react'
import type { CustomApplianceFormProps } from '../types'

export function CustomApplianceForm({
  customAppliance,
  activeCategory,
  onCustomApplianceChange,
  onAdd,
  onCancel,
}: CustomApplianceFormProps) {
  const categoryLabels: Record<string, string> = {
    essential: 'Essential Appliances',
    comfort: 'Comfort & Entertainment',
    future: 'Future Planning',
    custom: 'Custom Appliances',
  }

  const categoryColors: Record<string, string> = {
    essential: 'bg-red-100 text-red-600',
    comfort: 'bg-blue-100 text-blue-600',
    future: 'bg-teal-100 text-teal-600',
    custom: 'bg-gray-100 text-gray-600',
  }

  const categoryNames: Record<string, string> = {
    essential: 'Essential',
    comfort: 'Comfort',
    future: 'Future',
    custom: 'Custom',
  }

  return (
    <div className="card p-4 border-2 border-red-500">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">
          Add to: <span className="text-red-500 capitalize">{categoryLabels[activeCategory] || 'Custom Appliances'}</span>
        </h4>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${categoryColors[activeCategory] || categoryColors.custom}`}>
          {categoryNames[activeCategory] || 'Custom'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Appliance name"
          value={customAppliance.name}
          onChange={(e) => onCustomApplianceChange('name', e.target.value)}
          className="col-span-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <input
          type="number"
          placeholder="Quantity"
          min="1"
          value={customAppliance.quantity}
          onChange={(e) => onCustomApplianceChange('quantity', parseInt(e.target.value) || 1)}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <input
          type="number"
          placeholder="Watts"
          min="0"
          value={customAppliance.wattage || ''}
          onChange={(e) => onCustomApplianceChange('wattage', parseInt(e.target.value) || 0)}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <input
          type="number"
          placeholder="Hours/day"
          min="0"
          max="24"
          step="0.5"
          value={customAppliance.hoursPerDay || ''}
          onChange={(e) => onCustomApplianceChange('hoursPerDay', parseFloat(e.target.value) || 0)}
          className="col-span-2 md:col-span-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAdd}
          className="btn-primary flex-1"
          disabled={!customAppliance.name.trim() || customAppliance.wattage === 0}
        >
          Add Appliance
        </button>
        <button
          onClick={onCancel}
          className="btn-outline border-gray-300 text-gray-700 flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

