'use client'

import { Sun, BatteryCharging, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface ProgramSelectionModalProps {
  isOpen: boolean
  onSelect: (programType: 'net_metering' | 'hrs_residential' | 'quick', leadType: 'residential' | 'commercial', hasBattery?: boolean) => void
  onClose?: () => void
  isQuickEstimate?: boolean
}

export function ProgramSelectionModal({ isOpen, onSelect, onClose, isQuickEstimate = false }: ProgramSelectionModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<'net_metering' | 'hrs_residential' | null>(null)
  const [hasBattery, setHasBattery] = useState<boolean | null>(null)
  const [showLeadTypeSelection, setShowLeadTypeSelection] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset state when modal opens
      setSelectedProgram(null)
      setHasBattery(null)
      setShowLeadTypeSelection(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBatterySelect = (wantsBattery: boolean) => {
    setHasBattery(wantsBattery)
    setShowLeadTypeSelection(true)
  }

  const handleProgramSelect = (programType: 'net_metering' | 'hrs_residential') => {
    setSelectedProgram(programType)
    setShowLeadTypeSelection(true)
  }

  const handleLeadTypeSelect = (leadType: 'residential' | 'commercial') => {
    if (isQuickEstimate) {
      // For quick estimate: hasBattery determines program type
      // - true  -> Solar + Battery (HRS Program)
      // - false -> Solar Only (Net Metering)
      if (hasBattery !== null) {
        const programType = hasBattery ? 'hrs_residential' : 'net_metering'
        onSelect(programType, leadType, hasBattery)
      }
    } else {
      // For detailed mode: selectedProgram determines program type
      if (selectedProgram) {
        const hasBatteryValue = selectedProgram === 'hrs_residential'
        onSelect(selectedProgram, leadType, hasBatteryValue)
      }
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {}} // Prevent closing on backdrop click - user must select
      />
      
      {/* Modal container */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-navy-500">
              {showLeadTypeSelection 
                ? 'Select Property Type' 
                : isQuickEstimate 
                  ? 'Do You Want a Battery?'
                  : 'Select Program Type'}
            </h3>
            <div className="flex items-center gap-3">
              {showLeadTypeSelection && (
                <button
                  onClick={() => {
                    setShowLeadTypeSelection(false)
                    setHasBattery(null)
                    setSelectedProgram(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {!showLeadTypeSelection ? (
              <>
                {isQuickEstimate ? (
                  <>
                    {/* Quick Estimate: Battery Options */}
                    <p className="text-gray-700 mb-6 text-center">
                      Would you like to include battery storage with your solar system?
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* With Battery */}
                      <button
                        onClick={() => handleBatterySelect(true)}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-navy-500 hover:bg-navy-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-navy-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BatteryCharging className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">With Battery</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar + battery system</p>
                          <p>• Store energy for peak hours</p>
                          <p>• Reduce electricity costs</p>
                          <p>• Up to $10,000 CAD in rebates</p>
                        </div>
                      </button>
                      
                      {/* No Battery - Net Metering (Solar Only) */}
                      <button
                        onClick={() => handleBatterySelect(false)}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sun className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">No Battery (Net Metering)</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar-only system</p>
                          <p>• Lower upfront cost</p>
                          <p>• Earn credits for excess energy</p>
                          <p>• Ideal for quick savings estimate</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Detailed Analysis: Program Options */}
                    <p className="text-gray-700 mb-6 text-center">
                      Select your preferred program type
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Solar+Battery HRS Program */}
                      <button
                        onClick={() => handleProgramSelect('hrs_residential')}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-navy-500 hover:bg-navy-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-navy-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BatteryCharging className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">Solar+Battery HRS Program</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar + battery system</p>
                          <p>• Store energy for peak hours</p>
                          <p>• Reduce electricity costs</p>
                          <p>• Up to $10,000 CAD in rebates</p>
                        </div>
                      </button>
                      
                      {/* Net Metering */}
                      <button
                        onClick={() => handleProgramSelect('net_metering')}
                        className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sun className="text-white" size={24} />
                          </div>
                          <div className="font-semibold text-gray-800 text-lg">Net Metering</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>Solar-only system</p>
                          <p>• Sell excess energy to grid</p>
                          <p>• Lower upfront cost</p>
                          <p>• Earn export credits</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-6 text-center">
                  Is this a residential or commercial property?
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Residential Option */}
                  <button
                    onClick={() => handleLeadTypeSelect('residential')}
                    className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-red-500 hover:bg-red-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                      <div className="font-semibold text-gray-800 text-lg">Residential</div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>For homes, townhouses, and residential properties</p>
                      <p>• Single-family homes</p>
                      <p>• Townhouses</p>
                      <p>• Peak shaving benefits</p>
                    </div>
                  </button>
                  
                  {/* Commercial Option - Coming Soon */}
                  <button
                    disabled
                    className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed text-left relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                        COMING SOON
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-400 flex items-center justify-center">
                        <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                        </svg>
                      </div>
                      <div className="font-semibold text-gray-500 text-lg">Commercial</div>
                    </div>
                    <div className="text-sm text-gray-500 space-y-2">
                      <p>For businesses and commercial properties</p>
                      <p>• Demand charge optimization</p>
                      <p>• Peak shaving benefits</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

