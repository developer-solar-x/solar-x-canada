'use client'

// Step 0: Program Selection - Three entry options with Residential/Commercial selector

import { useState } from 'react'
import { Zap, BatteryCharging, Sun } from 'lucide-react'
import { ProgramCard } from './components/ProgramCard'
import { ComparisonTable } from './components/ComparisonTable'
import { LeadTypeModal } from './components/LeadTypeModal'
import type { StepModeSelectorProps, SelectedProgram, EstimatorMode, ProgramType, LeadType } from './types'

export function StepModeSelector({ onComplete }: StepModeSelectorProps) {
  // State for lead type selection modal
  const [showLeadTypeModal, setShowLeadTypeModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<SelectedProgram | null>(null)

  // Handle program selection - show lead type selector for Quick Estimate and HRS Residential
  const handleProgramSelect = (mode: EstimatorMode, programType: ProgramType) => {
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
  const handleLeadTypeSelect = (leadType: LeadType) => {
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
        <ProgramCard
          icon={
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
              <Sun className="text-white" size={32} />
            </div>
          }
          title="Solar Net Metering"
          description="Traditional grid-tied solar with bill credits for exports"
          badge="COMING SOON"
          badgeColor="bg-emerald-100 text-emerald-700"
          features={['No battery required']}
          buttonText="Coming Soon"
          onClick={selectNetMetering}
          disabled={true}
          comingSoon={true}
        />

        {/* Quick Estimate */}
        <ProgramCard
          icon={
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={32} />
            </div>
          }
          title="Quick Estimate"
          description="Get a ballpark estimate in minutes with minimal information"
          badge="RECOMMENDED"
          badgeColor="bg-red-100 text-red-600"
          features={[
            '3-5 minutes to complete',
            'Basic property info only',
            'Instant cost estimate',
            'Perfect for browsing',
          ]}
          buttonText="Start Quick Estimate"
          onClick={selectQuickEstimate}
        />

        {/* Solar + Battery HRS Program (Residential focus) */}
        <ProgramCard
          icon={
            <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BatteryCharging className="text-white" size={32} />
            </div>
          }
          title="Solar + Battery HRS Program"
          additionalInfo="Residential: Up to $10,000 rebate"
          description="Commercial: Up to $860,000"
          badge="HRS PROGRAM"
          badgeColor="bg-navy-100 text-navy-600"
          features={[
            'Includes battery peak-shaving savings',
            'Most accurate system design',
          ]}
          buttonText="Start HRS Program (Residential)"
          buttonClassName="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          onClick={selectHrsResidential}
        />
      </div>

      {/* Comparison table */}
      <ComparisonTable />

      {/* Lead Type Selection Modal */}
      <LeadTypeModal
        isOpen={showLeadTypeModal}
        onClose={() => {
          setShowLeadTypeModal(false)
          setSelectedProgram(null)
        }}
        onSelect={handleLeadTypeSelect}
      />
    </div>
  )
}

