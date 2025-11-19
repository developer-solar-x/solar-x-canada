'use client'

// Easy Mode: Simple Energy Calculator

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { InputToggle } from './components/InputToggle'
import { PlanTypeSelector } from './components/PlanTypeSelector'
import { AnnualUsageInput } from './components/AnnualUsageInput'
import { MonthlyBillInput } from './components/MonthlyBillInput'
import { ElectricityBillInflationCalculator } from './components/ElectricityBillInflationCalculator'
import { UpgradePrompt } from './components/UpgradePrompt'
import { BLENDED_RATE } from './constants'
import { useEnergyCalculation } from './hooks/useEnergyCalculation'
import type { StepEnergySimpleProps } from './types'

export function StepEnergySimple({ data, onComplete, onBack, onUpgradeMode }: StepEnergySimpleProps) {
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(
    data.energyUsage?.annualKwh?.toString() ||
      data.annualUsageKwh?.toString() ||
      ''
  )
  const [monthlyBillInput, setMonthlyBillInput] = useState<string>(data.monthlyBill?.toString() || '')
  const [useMonthlyBill, setUseMonthlyBill] = useState<boolean>(Boolean(data.monthlyBill && Number(data.monthlyBill) > 0))
  const [planType, setPlanType] = useState<'battery'>('battery')

  const { finalAnnualUsage, estimatedAnnualKwh } = useEnergyCalculation({
    useMonthlyBill,
    monthlyBillInput,
    annualUsageInput,
    setAnnualUsageInput
  })

  const handleContinue = () => {
    const annualUsageKwh = Math.max(0, finalAnnualUsage)

    onComplete({
      monthlyBill: useMonthlyBill && monthlyBillInput ? parseFloat(monthlyBillInput) : undefined,
      systemType: planType === 'battery' ? 'battery_system' : 'grid_tied',
      hasBattery: planType === 'battery',
      annualUsageKwh: annualUsageKwh || undefined,
      energyUsage: annualUsageKwh
        ? {
            annualKwh: annualUsageKwh,
            monthlyKwh: Math.round(annualUsageKwh / 12),
            dailyKwh: Math.round(annualUsageKwh / 365),
          }
        : undefined,
      energyEntryMethod: 'simple',
    })
  }

  const canContinue = finalAnnualUsage > 0 && Boolean(planType)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            Energy Usage
          </h2>
          <p className="text-gray-600">
            Just a couple quick questions about your electricity
          </p>
        </div>

        {/* Input Toggle */}
        <InputToggle
          useMonthlyBill={useMonthlyBill}
          onToggle={setUseMonthlyBill}
        />

        {/* Plan selection */}
        <PlanTypeSelector
          planType={planType}
          onPlanTypeChange={setPlanType}
        />

        {/* Annual Usage */}
        {!useMonthlyBill && (
          <AnnualUsageInput
            annualUsageInput={annualUsageInput}
            onAnnualUsageChange={setAnnualUsageInput}
          />
        )}

        {/* Monthly Bill */}
        {useMonthlyBill && (
          <>
            <MonthlyBillInput
              monthlyBillInput={monthlyBillInput}
              onMonthlyBillChange={setMonthlyBillInput}
            />
            
            {/* Electricity Bill Inflation Calculator */}
            {monthlyBillInput && Number(monthlyBillInput) > 0 && (
              <ElectricityBillInflationCalculator 
                monthlyBill={Number(monthlyBillInput)} 
              />
            )}
          </>
        )}

        {/* Upgrade to Detailed */}
        {onUpgradeMode && (
          <UpgradePrompt onUpgrade={onUpgradeMode} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 flex-1"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

