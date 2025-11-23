'use client'

// Step 0: Mode Selection - Easy vs Detailed

import { useState } from 'react'
import { Zap, BarChart3 } from 'lucide-react'
import { ComparisonTable } from './components/ComparisonTable'
import { ProgramSelectionModal } from './components/ProgramSelectionModal'
import type { StepModeSelectorProps } from './types'

export function StepModeSelector({ onComplete }: StepModeSelectorProps) {
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'easy' | 'detailed' | null>(null)

  const selectEasy = () => {
    setSelectedMode('easy')
    setShowProgramModal(true)
  }

  const selectDetailed = () => {
    setSelectedMode('detailed')
    setShowProgramModal(true)
  }

  const handleProgramSelect = (programType: 'net_metering' | 'hrs_residential' | 'quick', leadType: 'residential' | 'commercial', hasBattery?: boolean) => {
    if (selectedMode) {
      onComplete({ 
        estimatorMode: selectedMode,
        programType,
        leadType,
        hasBattery
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy-500 mb-4">
          Get Your Solar Estimate
        </h1>
        <p className="text-xl text-gray-600">
          Choose your preferred level of detail
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Estimate */}
        <div
          onClick={selectEasy}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-500 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Zap className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-navy-500 mb-3 text-center">
            Quick Estimate
          </h3>
          <p className="text-gray-600 mb-6 text-center">
            Get a ballpark estimate in minutes with minimal information
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>3-5 minutes to complete</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Basic property info only</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Instant cost estimate</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-red-500">✓</span>
              <span>Perfect for browsing</span>
            </li>
          </ul>
          <button className="btn-primary w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start Quick Estimate
            <Zap size={20} />
          </button>
        </div>

        {/* Detailed Analysis */}
        <div
          onClick={selectDetailed}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-navy-500 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <BarChart3 className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-navy-500 mb-3 text-center">
            Detailed Analysis
          </h3>
          <p className="text-gray-600 mb-6 text-center">
            Most accurate system design with detailed roof drawing
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-navy-500">✓</span>
              <span>Draw your roof on satellite map</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-navy-500">✓</span>
              <span>Precise system sizing</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-navy-500">✓</span>
              <span>Includes battery peak-shaving</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-navy-500">✓</span>
              <span>Most accurate estimate</span>
            </li>
          </ul>
          <button className="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start Detailed Analysis
            <BarChart3 size={20} />
          </button>
        </div>
      </div>

      {/* Comparison table */}
      <ComparisonTable />

      {/* Program Selection Modal */}
      <ProgramSelectionModal
        isOpen={showProgramModal}
        onSelect={handleProgramSelect}
        onClose={() => setShowProgramModal(false)}
        isQuickEstimate={selectedMode === 'easy'}
      />
    </div>
  )
}

