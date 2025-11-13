'use client'

// Step 0: Program Selection - Three entry options with Residential/Commercial selector

import { useState } from 'react'
import { Zap, BatteryCharging, ArrowRight, Sun, Home, Building2, X } from 'lucide-react'

interface StepModeSelectorProps {
  onComplete: (data: any) => void
}

export function StepModeSelector({ onComplete }: StepModeSelectorProps) {
  // State for lead type selection modal
  const [showLeadTypeModal, setShowLeadTypeModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<{ mode: 'easy' | 'detailed', programType: 'quick' | 'hrs_residential' } | null>(null)

  // Handle program selection - show lead type selector for Quick Estimate and HRS Residential
  const handleProgramSelect = (mode: 'easy' | 'detailed', programType: 'quick' | 'hrs_residential' | 'net_metering') => {
    if (programType === 'net_metering') {
      // Net Metering goes directly (coming soon, but if enabled later)
      onComplete({ estimatorMode: mode, programType: 'net_metering', leadType: 'residential' })
    } else {
      // Quick Estimate and HRS Residential need lead type selection
      setSelectedProgram({ mode, programType })
      setShowLeadTypeModal(true)
    }
  }

  // Handle lead type selection
  const handleLeadTypeSelect = (leadType: 'residential' | 'commercial') => {
    if (selectedProgram) {
      if (leadType === 'commercial') {
        // Commercial uses a different flow - set commercial mode
        onComplete({
          estimatorMode: 'commercial',
          programType: 'commercial',
          leadType: 'commercial'
        })
      } else {
        // Residential uses existing flow
        onComplete({
          estimatorMode: selectedProgram.mode,
          programType: selectedProgram.programType,
          leadType: 'residential'
        })
      }
      setShowLeadTypeModal(false)
      setSelectedProgram(null)
    }
  }

  const selectQuickEstimate = () => {
    handleProgramSelect('easy', 'quick')
  }

  const selectHrsResidential = () => {
    handleProgramSelect('detailed', 'hrs_residential')
  }

  const selectNetMetering = () => {
    handleProgramSelect('detailed', 'net_metering')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy-500 mb-4">
          Get Your Solar Estimate
        </h1>
        <p className="text-xl text-gray-600">
          Choose the best option for you
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Solar Net Metering (Coming Soon) - placed first */}
        <div 
          aria-disabled
          className="card p-8 opacity-60 border-2 border-dashed border-emerald-300 cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
              <Sun className="text-white" size={32} />
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              COMING SOON
            </span>
          </div>

          <h2 className="text-2xl font-bold text-navy-500 mb-3">
            Solar Net Metering
          </h2>
          
          <p className="text-gray-600 mb-6">
            Traditional grid-tied solar with bill credits for exports
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">No battery required</span>
            </div>
          </div>

          <button className="bg-emerald-600/60 text-white font-semibold py-3 px-6 rounded-lg w-full" disabled>
            Coming Soon
          </button>
        </div>

        {/* Quick Estimate */}
        <div 
          onClick={selectQuickEstimate}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-500 group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={32} />
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              RECOMMENDED
            </span>
          </div>

          <h2 className="text-2xl font-bold text-navy-500 mb-3">
            Quick Estimate
          </h2>
          
          <p className="text-gray-600 mb-6">
            Get a ballpark estimate in minutes with minimal information
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">3-5 minutes to complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Basic property info only</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Instant cost estimate</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Perfect for browsing</span>
            </div>
          </div>

          <button className="btn-primary w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start Quick Estimate
            <ArrowRight size={20} />
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            You can upgrade to detailed later
          </p>
        </div>

        {/* Solar + Battery HRS Program (Residential focus) */}
        <div 
          onClick={selectHrsResidential}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-navy-500 group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BatteryCharging className="text-white" size={32} />
            </div>
            <span className="px-3 py-1 bg-navy-100 text-navy-600 text-xs font-bold rounded-full">
              HRS PROGRAM
            </span>
          </div>

          <h2 className="text-2xl font-bold text-navy-500 mb-1">
            Solar + Battery HRS Program
          </h2>
          <p className="text-sm text-gray-600 mb-4 font-semibold">Residential: Up to $10,000 rebate</p>
          <p className="text-sm text-gray-600 mb-6">Commercial: Up to $860,000</p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Includes battery peak-shaving savings</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Most accurate system design</span>
            </div>
          </div>

          <button className="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start HRS Program (Residential)
            <ArrowRight size={20} />
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            We’ll confirm eligibility during review
          </p>
        </div>

        
      </div>

      {/* Comparison table */}
      <div className="mt-12 card p-6">
        <h3 className="font-bold text-navy-500 mb-4 text-center">Quick Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-semibold">Feature</th>
                <th className="text-center py-2 text-red-600 font-semibold">Quick Estimate</th>
                <th className="text-center py-2 text-navy-600 font-semibold">HRS Program</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="py-3">Time Required</td>
                <td className="text-center text-red-600 font-semibold">3-5 min</td>
                <td className="text-center text-navy-600">10-15 min</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Roof Input</td>
                <td className="text-center">Preset size selection</td>
                <td className="text-center">Interactive satellite map drawing</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Energy Entry</td>
                <td className="text-center">Monthly bill input</td>
                <td className="text-center">Property details & monthly bill</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Battery Peak Shaving</td>
                <td className="text-center">Available (HRS program)</td>
                <td className="text-center">Available (HRS program)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Photos</td>
                <td className="text-center">Simple (2-3 photos)</td>
                <td className="text-center">Organized categories (up to 17)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">System Accuracy</td>
                <td className="text-center">±15-20%</td>
                <td className="text-center">±5-10%</td>
              </tr>
              <tr>
                <td className="py-3">Best For</td>
                <td className="text-center">Quick estimates, browsing</td>
                <td className="text-center">Accurate quotes, HRS rebates</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Type Selection Modal */}
      {showLeadTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowLeadTypeModal(false)
                setSelectedProgram(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-navy-500 mb-2">
                Select Property Type
              </h2>
              <p className="text-gray-600">
                Choose whether this is a residential or commercial property
              </p>
            </div>

            {/* Lead Type Options */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Residential Option */}
              <div
                onClick={() => handleLeadTypeSelect('residential')}
                className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-navy-500 group text-left"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Home className="text-white" size={32} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-navy-500 mb-3">
                  Residential
                </h3>
                
                <p className="text-gray-600 mb-6">
                  For homes, townhouses, and residential properties
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Single-family homes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Townhouses & condos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">Up to $10,000 HRS rebate</span>
                  </div>
                </div>

                <div className="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2">
                  Select Residential
                  <ArrowRight size={20} />
                </div>
              </div>

              {/* Commercial Option - Moved to Admin Panel */}
              <div
                className="card p-8 opacity-60 border-2 border-dashed border-gray-300 cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <Building2 className="text-white" size={32} />
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    ADMIN TOOL
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-500 mb-3">
                  Commercial
                </h3>
                
                <p className="text-gray-500 mb-6">
                  Demand charge calculator available in admin panel
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500">Battery demand charge calculator</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500">Available in admin dashboard</span>
                  </div>
                </div>

                <button className="bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg w-full cursor-not-allowed" disabled>
                  Admin Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

