'use client'

import { Plus } from 'lucide-react'
import { ApplianceRow } from './ApplianceRow'
import type { ApplianceTableProps } from '../types'

export function ApplianceTable({
  appliances,
  category,
  title,
  description,
  icon,
  headerColor,
  buttonColor,
  onUpdateAppliance,
  onRemoveAppliance,
  onAddClick,
}: ApplianceTableProps) {
  const categoryAppliances = appliances.filter(app => app.category === category)

  return (
    <div className="card overflow-hidden">
      <div className={`bg-gradient-to-r ${headerColor} text-white px-4 py-3 flex items-center justify-between`}>
        <div>
          <h3 className="font-bold flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <p className="text-sm opacity-90 mt-0.5">{description}</p>
        </div>
        <button
          onClick={onAddClick}
          className={`bg-white ${buttonColor} px-3 py-1.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-1`}
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Appliance</th>
              <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Qty</th>
              <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Watts</th>
              <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Hours/Day</th>
              <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Daily kWh</th>
              <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {categoryAppliances.map(appliance => (
              <ApplianceRow
                key={appliance.id}
                appliance={appliance}
                onUpdate={(field, value) => onUpdateAppliance(appliance.id, field, value)}
                onRemove={() => onRemoveAppliance(appliance.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

