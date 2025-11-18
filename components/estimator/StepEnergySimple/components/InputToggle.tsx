'use client'

import type { InputToggleProps } from '../types'

export function InputToggle({ useMonthlyBill, onToggle }: InputToggleProps) {
  return (
    <div className="mb-6 flex gap-2">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
          !useMonthlyBill ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:border-red-300'
        }`}
      >
        Enter annual usage
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
          useMonthlyBill ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:border-red-300'
        }`}
      >
        I only know my bill
      </button>
    </div>
  )
}

