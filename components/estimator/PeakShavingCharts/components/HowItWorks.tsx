'use client'

import type { HowItWorksProps } from '../types'

export function HowItWorks({ totalKwhShifted, cyclesPerYear }: HowItWorksProps) {
  return (
    <div className="card p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <h4 className="text-lg font-semibold text-navy-500 mb-4">
        How Peak Shaving Works
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Charging */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
              1
            </div>
            <div className="font-semibold text-navy-500">Charge During Cheap Hours</div>
          </div>
          <p className="text-sm text-gray-600 ml-13">
            Your battery charges automatically during ultra-low or off-peak hours when electricity is cheapest (as low as 3.9¢/kWh).
          </p>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            Typically: 11 PM - 7 AM
          </div>
        </div>

        {/* Discharging */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold mr-3">
              2
            </div>
            <div className="font-semibold text-navy-500">Use During Peak Hours</div>
          </div>
          <p className="text-sm text-gray-600 ml-13">
            During expensive peak hours, your battery powers your home instead of drawing from the grid (avoiding rates up to 39.1¢/kWh).
          </p>
          <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
            Typically: 4 PM - 9 PM
          </div>
        </div>
      </div>

      {/* Energy shifted */}
      <div className="mt-6 pt-6 border-t border-navy-200">
        <div className="text-center">
          <div className="text-sm text-navy-700 font-medium mb-2">
            Energy Shifted Per Year
          </div>
          <div className="text-3xl font-bold text-navy-600">
            {totalKwhShifted.toFixed(0)} kWh
          </div>
          <div className="text-sm text-navy-600 mt-1">
            ~{cyclesPerYear} full battery cycles per year
          </div>
        </div>
      </div>
    </div>
  )
}

