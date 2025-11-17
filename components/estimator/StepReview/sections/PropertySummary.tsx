'use client'

import { Home, MapPin } from 'lucide-react'

interface PropertySummaryProps {
  address: string
  onEdit: () => void
}

export function PropertySummary({ address, onEdit }: PropertySummaryProps) {
  return (
    <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-navy-500 rounded-lg">
          <Home className="text-white" size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-navy-500 mb-1 flex items-center gap-2">
            Property Location
          </h3>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 font-medium">{address}</p>
          </div>
          <button
            onClick={onEdit}
            className="text-xs text-red-500 hover:text-red-600 font-semibold mt-2.5 flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            <span>Edit Details</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

