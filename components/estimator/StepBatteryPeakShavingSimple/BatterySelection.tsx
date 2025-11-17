'use client'

import { Battery, DollarSign, TrendingDown, Sun, Award, Plus, X, ChevronDown } from 'lucide-react'
import { BATTERY_SPECS, BatterySpec, calculateBatteryFinancials } from '@/config/battery-specs'

interface BatterySelectionProps {
  selectedBatteries: string[]
  onBatteriesChange: (batteries: string[]) => void
  effectiveSystemSizeKw: number
}

export function BatterySelection({ selectedBatteries, onBatteriesChange, effectiveSystemSizeKw }: BatterySelectionProps) {
  const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
  
  // Calculate solar rebate if solar system exists
  const solarRebatePerKw = 1000
  const solarMaxRebate = 5000
  const solarRebate = effectiveSystemSizeKw > 0 ? Math.min(effectiveSystemSizeKw * solarRebatePerKw, solarMaxRebate) : 0

  // Create combined battery spec
  const combinedBattery = batteries.length > 0 ? batteries.reduce((combined, current, idx) => {
    if (idx === 0) return { ...current }
    return {
      ...combined,
      nominalKwh: combined.nominalKwh + current.nominalKwh,
      usableKwh: combined.usableKwh + current.usableKwh,
      price: combined.price + current.price
    }
  }, batteries[0]) : null

  const financials = combinedBattery ? calculateBatteryFinancials(combinedBattery) : null
  const totalRebates = financials ? financials.rebate + solarRebate : 0
  const netCostWithSolarRebate = combinedBattery ? combinedBattery.price - totalRebates : 0

  return (
    <div className="card p-6 shadow-md">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-100 rounded-lg">
          <Battery className="text-red-500" size={24} />
        </div>
        <h3 className="text-2xl font-bold text-navy-500">Choose Your Batteries</h3>
      </div>
      
      <div className="space-y-5">
        {/* Battery Selection List */}
        {selectedBatteries.map((batteryId, index) => {
          const battery = BATTERY_SPECS.find(b => b.id === batteryId)
          if (!battery) return null
          
          return (
            <div key={`${batteryId}-${index}`} className="p-4 bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Battery size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-navy-600 text-sm mb-2">
                      Battery {index + 1}
                    </div>
                    <div className="relative">
                      <select
                        value={batteryId}
                        onChange={(e) => {
                          const newBatteries = [...selectedBatteries]
                          newBatteries[index] = e.target.value
                          onBatteriesChange(newBatteries)
                        }}
                        className="w-full px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-bold text-navy-600 bg-white shadow-sm appearance-none cursor-pointer transition-all"
                      >
                        {BATTERY_SPECS.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.brand} {b.model}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>
                {selectedBatteries.length > 1 && (
                  <button
                    onClick={() => onBatteriesChange(selectedBatteries.filter((_, i) => i !== index))}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="text-red-500" size={20} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add Battery Button */}
        {selectedBatteries.length < 3 && (
          <button
            onClick={() => onBatteriesChange([...selectedBatteries, BATTERY_SPECS[0].id])}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-red-500 hover:bg-red-50 hover:text-navy-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="text-red-500" size={20} />
            <span className="font-semibold">Add Another Battery</span>
          </button>
        )}

        {/* Combined Battery Summary */}
        {combinedBattery && financials && (
          <div className="p-5 bg-gradient-to-br from-red-50 to-white border-2 border-red-500 rounded-xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Battery size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-navy-500 text-xl">
                    {batteries.map(b => `${b.brand} ${b.model}`).join(' + ')}
                  </div>
                  <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                    SELECTED
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Total Price</div>
                      <div className="font-bold text-navy-600">${combinedBattery.price.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={18} className="text-green-600" />
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Battery Rebate</div>
                      <div className="font-bold text-green-600">-${financials.rebate.toLocaleString()}</div>
                    </div>
                  </div>
                  {solarRebate > 0 && (
                    <div className="flex items-center gap-2">
                      <Sun size={18} className="text-green-600" />
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Solar Rebate</div>
                        <div className="font-bold text-green-600">-${solarRebate.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Award size={18} className={netCostWithSolarRebate < 0 ? 'text-green-600' : 'text-red-500'} />
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Net Cost</div>
                      <div className={`font-bold ${netCostWithSolarRebate < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netCostWithSolarRebate < 0 ? '+' : ''}${Math.abs(netCostWithSolarRebate).toLocaleString()}
                        {netCostWithSolarRebate < 0 && <span className="text-xs ml-1">(Credit)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

