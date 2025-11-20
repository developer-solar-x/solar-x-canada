'use client'

import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FINANCING_OPTIONS, calculateFinancing } from '@/config/provinces'

interface FinancingOptionsProps {
  combinedNetCost: number
  selectedFinancing: string
  onFinancingChange: (id: string) => void
  hasBattery: boolean
}

export function FinancingOptions({
  combinedNetCost,
  selectedFinancing,
  onFinancingChange,
  hasBattery,
}: FinancingOptionsProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
            <CreditCard size={24} className="text-red-500" />
            Financing Options
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Choose how you'd like to pay for your {hasBattery ? 'solar + battery system' : 'solar system'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {FINANCING_OPTIONS.map((option) => {
          const totalCost = combinedNetCost
          const financing = calculateFinancing(
            totalCost,
            option.interestRate,
            option.termYears
          )
          const isSelected = selectedFinancing === option.id
          
          return (
            <button
              key={option.id}
              onClick={() => onFinancingChange(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-navy-500 mb-1">
                {option.name}
              </div>
              {option.termYears > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-500 mb-1">
                    ${financing.monthlyPayment}/mo
                  </div>
                  <div className="text-xs text-gray-600">Estimated monthly payment</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${totalCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    One-time payment
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    Best long-term value
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>
      
      {selectedFinancing === 'cash' && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-semibold text-green-800 mb-1">
            Great choice! Cash payment offers the best long-term value.
          </p>
          <p className="text-xs text-green-700">
            You'll save on interest charges and maximize your return on investment. Your total investment of {formatCurrency(combinedNetCost)} includes all rebates and incentives.
          </p>
        </div>
      )}
    </div>
  )
}

