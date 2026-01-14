'use client'

// Step 0: Province Selection - All Canadian Provinces

import { useState } from 'react'
import { MapPin, Check, Clock } from 'lucide-react'
import { getAllProvinces } from '@/config/provinces'
import type { StepProvinceSelectorProps } from './types'

export function StepProvinceSelector({ data, onComplete }: StepProvinceSelectorProps) {
  const [selectedProvince, setSelectedProvince] = useState<'toronto' | 'alberta' | null>(
    data.selectedProvince || null
  )

  const provinces = getAllProvinces()
  const enabledProvinces = provinces.filter(p => p.enabled)
  const comingSoonProvinces = provinces.filter(p => !p.enabled)

  const handleProvinceSelect = (provinceCode: string) => {
    const province = provinces.find(p => p.code === provinceCode)
    if (!province || !province.enabled) return

    // Map province codes to the expected format
    let selectedValue: 'toronto' | 'alberta' | null = null
    if (province.code === 'ON') {
      selectedValue = 'toronto'
    } else if (province.code === 'AB') {
      selectedValue = 'alberta'
    }

    if (selectedValue) {
      setSelectedProvince(selectedValue)
      
      // For Alberta, show Solar Club message and proceed directly
      if (selectedValue === 'alberta') {
        onComplete({ 
          selectedProvince: selectedValue,
          province: 'AB'
        })
      }
      // For Toronto, we'll show questions/recommendations in the next step
      else if (selectedValue === 'toronto') {
        onComplete({ 
          selectedProvince: selectedValue,
          province: 'ON'
        })
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy-500 mb-4">
          Select Your Province
        </h1>
        <p className="text-xl text-gray-600">
          Choose your location to get started
        </p>
      </div>

      {/* Available Provinces */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Now</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {enabledProvinces.map((province) => {
            const isSelected = (province.code === 'ON' && selectedProvince === 'toronto') ||
                              (province.code === 'AB' && selectedProvince === 'alberta')
            
            return (
              <div
                key={province.code}
                onClick={() => handleProvinceSelect(province.code)}
                className={`card p-8 hover:shadow-xl transition-all cursor-pointer border-2 ${
                  isSelected
                    ? province.code === 'ON' 
                      ? 'border-red-500 bg-red-50'
                      : 'border-navy-500 bg-navy-50'
                    : 'border-transparent hover:border-forest-500'
                } group`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${
                  isSelected
                    ? province.code === 'ON' ? 'bg-red-500' : 'bg-navy-500'
                    : province.code === 'ON'
                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                      : 'bg-gradient-to-br from-navy-500 to-blue-500'
                }`}>
                  {isSelected ? (
                    <Check className="text-white" size={32} />
                  ) : (
                    <MapPin className="text-white" size={32} />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-navy-500 mb-3 text-center">
                  {province.code === 'ON' ? 'Toronto, Ontario' : province.name}
                </h3>
                {province.code === 'ON' ? (
                  <>
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
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Coming Soon Provinces */}
      {comingSoonProvinces.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Coming Soon</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {comingSoonProvinces.map((province) => (
              <div
                key={province.code}
                className="card p-6 border-2 border-gray-200 opacity-75 cursor-not-allowed relative"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-300">
                  <MapPin className="text-gray-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-600 mb-2 text-center">
                  {province.name}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                  <Clock size={14} />
                  <span>Coming Soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

