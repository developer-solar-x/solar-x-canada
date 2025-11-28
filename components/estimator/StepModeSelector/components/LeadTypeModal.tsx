'use client'

import { X, Home, Building2, ArrowRight } from 'lucide-react'
import { LeadTypeCard } from './LeadTypeCard'
import type { LeadTypeModalProps } from '../types'

export function LeadTypeModal({ isOpen, onClose, onSelect }: LeadTypeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
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
          <LeadTypeCard
            icon={
              <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Home className="text-white" size={32} />
              </div>
            }
            title="Residential"
            description="For homes, townhouses, and residential properties"
            features={[
              'Single-family homes',
              'Townhouses',
              'Peak shaving benefits',
            ]}
            buttonText="Select Residential"
            onClick={() => onSelect('residential')}
          />

          {/* Commercial Option - Moved to Admin Panel */}
          <LeadTypeCard
            icon={
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <Building2 className="text-white" size={32} />
              </div>
            }
            title="Commercial"
            description="Demand charge calculator available in admin panel"
            features={[
              'Battery demand charge calculator',
              'Available in admin dashboard',
            ]}
            buttonText="Admin Only"
            onClick={() => {}}
            disabled={true}
            badge="ADMIN TOOL"
            badgeColor="bg-blue-100 text-blue-700"
          />
        </div>
      </div>
    </div>
  )
}

