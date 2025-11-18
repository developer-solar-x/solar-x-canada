'use client'

import { ArrowRight } from 'lucide-react'
import type { UpgradePromptProps } from '../types'

export function UpgradePrompt({ onUpgrade }: UpgradePromptProps) {
  return (
    <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-navy-500 mb-1 text-sm">Want more accuracy?</h4>
          <p className="text-xs text-gray-700 mb-2">
            Switch to detailed mode to draw your exact roof on a satellite map
          </p>
          <button
            onClick={onUpgrade}
            className="text-sm text-navy-600 hover:underline font-semibold flex items-center gap-1"
          >
            Draw on Map Instead
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

