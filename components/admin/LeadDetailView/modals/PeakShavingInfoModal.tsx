'use client'

import { X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getCombinedBlock } from '../utils'

interface PeakShavingInfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body: React.ReactNode
}

export function PeakShavingInfoModal({ isOpen, onClose, title, body }: PeakShavingInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-600">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="mt-3 max-h-[65vh] overflow-y-auto">
          {body}
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="btn-primary px-4 py-2">Close</button>
        </div>
      </div>
    </div>
  )
}

