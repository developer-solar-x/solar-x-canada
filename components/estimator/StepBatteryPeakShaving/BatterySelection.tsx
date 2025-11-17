'use client'

import { Check } from 'lucide-react'
import { BATTERY_SPECS } from '@/config/battery-specs'
import { calculateBatteryFinancials } from '@/config/battery-specs'

interface BatterySelectionProps {
  selectedBattery: string
  onBatteryChange: (batteryId: string) => void
  showComparison: boolean
  onToggleComparison: () => void
  comparisonBatteries: string[]
  onToggleComparisonBattery: (batteryId: string) => void
}

export function BatterySelection({
  selectedBattery,
  onBatteryChange,
  showComparison,
  onToggleComparison,
  comparisonBatteries,
  onToggleComparisonBattery,
}: BatterySelectionProps) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-semibold text-navy-500 mb-2">
        Choose Your Battery
      </h3>
      <p className="text-gray-600 text-sm mb-6">
        Select the battery system for your home. This will be included in your quote.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BATTERY_SPECS.map(battery => {
          const financials = calculateBatteryFinancials(battery)
          const isSelected = selectedBattery === battery.id
          
          return (
            <button
              key={battery.id}
              onClick={() => onBatteryChange(battery.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-50 shadow-lg'
                  : 'border-gray-300 hover:border-red-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-navy-500">{battery.brand}</div>
                  <div className="text-sm text-gray-600">{battery.model}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{battery.usableKwh} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${battery.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rebate:</span>
                  <span className="font-medium text-green-600">
                    -${financials.rebate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold text-gray-700">Net Cost:</span>
                  <span className="font-bold text-navy-500">
                    ${financials.netPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {battery.description && (
                <p className="text-xs text-gray-500 mt-2">{battery.description}</p>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Optional: Compare with other batteries */}
      <div className="mt-6 pt-6 border-t">
        <button
          onClick={onToggleComparison}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          {showComparison ? '− Hide' : '+ Compare with other options'}
        </button>
        
        {showComparison && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">
              Select additional batteries to compare (optional):
            </p>
            <div className="flex flex-wrap gap-2">
              {BATTERY_SPECS.filter(b => b.id !== selectedBattery).map(battery => (
                <button
                  key={battery.id}
                  onClick={() => onToggleComparisonBattery(battery.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    comparisonBatteries.includes(battery.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {battery.brand} {battery.model}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

