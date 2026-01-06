'use client'

// Step 0: Province Selection - Toronto or Alberta

import { useState } from 'react'
import { MapPin, Check } from 'lucide-react'
import type { StepProvinceSelectorProps } from './types'

export function StepProvinceSelector({ data, onComplete }: StepProvinceSelectorProps) {
  const [selectedProvince, setSelectedProvince] = useState<'toronto' | 'alberta' | null>(
    data.selectedProvince || null
  )

  const handleProvinceSelect = (province: 'toronto' | 'alberta') => {
    setSelectedProvince(province)
    
    // For Alberta, show Solar Club message and proceed directly
    if (province === 'alberta') {
      // Set province in data and proceed to location step
      onComplete({ 
        selectedProvince: province,
        province: 'AB'
      })
    }
    // For Toronto, we'll show questions/recommendations in the next step
    // For now, just proceed to location step
    else if (province === 'toronto') {
      onComplete({ 
        selectedProvince: province,
        province: 'ON'
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy-500 mb-4">
          Select Your Province
        </h1>
        <p className="text-xl text-gray-600">
          Choose your location to get started
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Toronto Option */}
        <div
          onClick={() => handleProvinceSelect('toronto')}
          className={`card p-8 hover:shadow-xl transition-all cursor-pointer border-2 ${
            selectedProvince === 'toronto'
              ? 'border-red-500 bg-red-50'
              : 'border-transparent hover:border-red-500'
          } group`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${
            selectedProvince === 'toronto'
              ? 'bg-red-500'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            {selectedProvince === 'toronto' ? (
              <Check className="text-white" size={32} />
            ) : (
              <MapPin className="text-white" size={32} />
            )}
          </div>
          <h3 className="text-2xl font-bold text-navy-500 mb-3 text-center">
            Toronto, Ontario
          </h3>
          <p className="text-gray-600 mb-6 text-center">
            Get a personalized solar estimate with questions and recommendations
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Personalized recommendations</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Detailed solar analysis</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Multiple program options</span>
            </li>
          </ul>
          <button className="btn-primary w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Select Toronto
            <MapPin size={20} />
          </button>
        </div>

        {/* Alberta Option */}
        <div
          onClick={() => handleProvinceSelect('alberta')}
          className={`card p-8 hover:shadow-xl transition-all cursor-pointer border-2 ${
            selectedProvince === 'alberta'
              ? 'border-navy-500 bg-navy-50'
              : 'border-transparent hover:border-navy-500'
          } group`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${
            selectedProvince === 'alberta'
              ? 'bg-navy-500'
              : 'bg-gradient-to-br from-navy-500 to-blue-500'
          }`}>
            {selectedProvince === 'alberta' ? (
              <Check className="text-white" size={32} />
            ) : (
              <MapPin className="text-white" size={32} />
            )}
          </div>
          <h3 className="text-2xl font-bold text-navy-500 mb-3 text-center">
            Alberta
          </h3>
          <p className="text-gray-600 mb-6 text-center">
            Alberta Solar Club program available
          </p>
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">
                  Alberta Solar Club Only
                </p>
                <p className="text-xs text-blue-700">
                  You'll proceed directly to address input. No additional questions required.
                </p>
              </div>
            </div>
          </div>
          <button className="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Select Alberta
            <MapPin size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

