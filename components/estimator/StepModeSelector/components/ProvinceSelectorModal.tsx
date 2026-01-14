'use client'

// Province Selection Modal with Dropdown

import { useState } from 'react'
import { X, ChevronDown, MapPin, Clock } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { getAllProvinces } from '@/config/provinces'

interface ProvinceSelectorModalProps {
  isOpen: boolean
  onSelect: (province: 'toronto' | 'alberta') => void
  onClose: () => void
}

export function ProvinceSelectorModal({ isOpen, onSelect, onClose }: ProvinceSelectorModalProps) {
  const [selectedProvince, setSelectedProvince] = useState<'toronto' | 'alberta' | ''>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  const allProvinces = getAllProvinces()
  const enabledProvinces = allProvinces.filter(p => p.enabled)
  const comingSoonProvinces = allProvinces.filter(p => !p.enabled)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setSelectedProvince('')
      setIsDropdownOpen(false)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleProvinceSelect = (provinceCode: string) => {
    const province = allProvinces.find(p => p.code === provinceCode)
    if (!province || !province.enabled) return
    
    // Map province codes to the expected format
    if (province.code === 'ON') {
      setSelectedProvince('toronto')
    } else if (province.code === 'AB') {
      setSelectedProvince('alberta')
    }
    setIsDropdownOpen(false)
  }

  const handleContinue = () => {
    if (selectedProvince) {
      onSelect(selectedProvince)
    }
  }

  const provinceOptions = enabledProvinces.map(province => ({
    value: province.code,
    label: province.code === 'ON' ? 'Ontario' : province.name,
    description: province.code === 'ON' 
      ? 'Personalized recommendations and detailed solar analysis'
      : 'Alberta Solar Club program available'
  }))

  const selectedProvinceData = selectedProvince 
    ? provinceOptions.find(p => (p.value === 'ON' && selectedProvince === 'toronto') || (p.value === 'AB' && selectedProvince === 'alberta'))
    : null

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-navy-500">Select Your Province</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm">
            Choose your province to continue with your solar estimate
          </p>

          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-navy-500 focus:outline-none focus:border-navy-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                {selectedProvinceData ? (
                  <>
                    <MapPin className="text-navy-500" size={20} />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{selectedProvinceData.label}</div>
                      <div className="text-xs text-gray-500">{selectedProvinceData.description}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">Select a province...</span>
                )}
              </div>
              <ChevronDown
                className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                size={20}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
                {/* Available Provinces */}
                {enabledProvinces.length > 0 && (
                  <>
                    {provinceOptions.map((province) => {
                      const isSelected = (province.value === 'ON' && selectedProvince === 'toronto') ||
                                        (province.value === 'AB' && selectedProvince === 'alberta')
                      return (
                        <button
                          key={province.value}
                          type="button"
                          onClick={() => handleProvinceSelect(province.value)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-navy-50 border-l-4 border-navy-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="text-navy-500" size={20} />
                            <div>
                              <div className="font-medium text-gray-900">{province.label}</div>
                              <div className="text-xs text-gray-500">{province.description}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </>
                )}
                
                {/* Coming Soon Provinces */}
                {comingSoonProvinces.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase">Coming Soon</div>
                    </div>
                    {comingSoonProvinces.map((province) => (
                      <div
                        key={province.code}
                        className="w-full text-left px-4 py-3 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="text-gray-400" size={20} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-500">{province.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={12} />
                              <span>Coming Soon</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Alberta Solar Club Notice */}
          {selectedProvince === 'alberta' && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Alberta Solar Club Program
                  </p>
                  <p className="text-xs text-blue-700">
                    Get started with your solar estimate right away. Simply enter your address to continue.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedProvince}
            className="px-4 py-2 text-sm font-semibold text-white bg-navy-500 rounded-lg hover:bg-navy-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

