'use client'

// Easy Mode: Simple Energy Calculator

import { useEffect, useState, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { InputToggle } from './components/InputToggle'
import { AnnualUsageInput } from './components/AnnualUsageInput'
import { MonthlyBillInput } from './components/MonthlyBillInput'
import { ElectricityBillInflationCalculator } from './components/ElectricityBillInflationCalculator'
import { UpgradePrompt } from './components/UpgradePrompt'
import { BLENDED_RATE } from './constants'
import { useEnergyCalculation } from './hooks/useEnergyCalculation'
import type { StepEnergySimpleProps } from './types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { isValidEmail } from '@/lib/utils'

export function StepEnergySimple({ data, onComplete, onBack, onUpgradeMode }: StepEnergySimpleProps) {
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(
    data.energyUsage?.annualKwh?.toString() ||
      data.annualUsageKwh?.toString() ||
      ''
  )
  const [monthlyBillInput, setMonthlyBillInput] = useState<string>(data.monthlyBill?.toString() || '')
  const [useMonthlyBill, setUseMonthlyBill] = useState<boolean>(Boolean(data.monthlyBill && Number(data.monthlyBill) > 0))
  // Use hasBattery from initial selection (from modal), default to true for quick estimate
  const hasBattery = data.hasBattery !== undefined ? data.hasBattery : true
  const [annualEscalator, setAnnualEscalator] = useState<number>(() => {
    const value = data.annualEscalator ?? 4.5
    return value
  })
  // Separate state for the direct input field to handle intermediate typing states
  const [annualEscalatorInput, setAnnualEscalatorInput] = useState<string>(() => {
    const value = data.annualEscalator ?? 4.5
    return value.toString()
  })
  
  // Sync annualEscalator from data prop when it changes (e.g., when loading from storage)
  useEffect(() => {
    if (data.annualEscalator !== undefined && data.annualEscalator !== annualEscalator) {
      setAnnualEscalator(data.annualEscalator)
      setAnnualEscalatorInput(data.annualEscalator.toString())
    }
  }, [data.annualEscalator])
  
  // Sync input field when annualEscalator changes from other sources (e.g., calculator component)
  // Only sync if the parsed input value doesn't match the annualEscalator (to avoid overwriting user typing)
  useEffect(() => {
    const parsedInput = parseFloat(annualEscalatorInput)
    const shouldSync = isNaN(parsedInput) || Math.abs(parsedInput - annualEscalator) > 0.001
    if (shouldSync) {
      setAnnualEscalatorInput(annualEscalator.toString())
    }
  }, [annualEscalator]) // Only depend on annualEscalator
  
  const handleAnnualEscalatorChange = useCallback((value: number) => {
    setAnnualEscalator(value)
  }, []) // Empty dependency array - this function doesn't depend on any props or state

  const { finalAnnualUsage, estimatedAnnualKwh } = useEnergyCalculation({
    useMonthlyBill,
    monthlyBillInput,
    annualUsageInput,
    setAnnualUsageInput
  })

  const handleContinue = () => {
    const annualUsageKwh = Math.max(0, finalAnnualUsage)

    // Only include annualEscalator if it's a valid number
    const finalAnnualEscalator = (annualEscalator !== undefined && !isNaN(annualEscalator) && annualEscalator >= 0) 
      ? annualEscalator 
      : undefined

    const stepData = {
      monthlyBill: useMonthlyBill && monthlyBillInput ? parseFloat(monthlyBillInput) : undefined,
      systemType: hasBattery ? 'battery_system' : 'grid_tied',
      hasBattery: hasBattery,
      annualUsageKwh: annualUsageKwh || undefined,
      energyUsage: annualUsageKwh
        ? {
            annualKwh: annualUsageKwh,
            monthlyKwh: Math.round(annualUsageKwh / 12),
            dailyKwh: Math.round(annualUsageKwh / 365),
          }
        : undefined,
      energyEntryMethod: 'simple',
      ...(finalAnnualEscalator !== undefined && { annualEscalator: finalAnnualEscalator }),
    }

    // Save partial lead for quick/easy residential flows
    const email = data.email
    const isEasy = data.estimatorMode === 'easy'
    const isResidential = data.leadType === 'residential'
    const isQuickOrHrs = data.programType === 'hrs_residential' || data.programType === 'quick'
    const isNetMetering = data.programType === 'net_metering'
    const isQuickBatteryFlow = isEasy && isResidential && isQuickOrHrs && hasBattery
    const isQuickNetMeteringFlow = isEasy && isResidential && isNetMetering

    if (
      email &&
      isValidEmail(email) &&
      (isQuickBatteryFlow || isQuickNetMeteringFlow)
    ) {
      void fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: {
            ...data,
            ...stepData,
            email,
          },
          // Easy mode energy step – same logical position as detailed energy/details
          currentStep: 3,
        }),
      }).catch((error) => {
        console.error('Failed to save Energy Simple progress (partial lead):', error)
      })
    }

    onComplete(stepData)
  }

  const canContinue = finalAnnualUsage > 0

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
                annualEscalator={annualEscalator}
                onAnnualEscalatorChange={handleAnnualEscalatorChange}
              />
            )}
          </>
        )}

        {/* Always show annual escalation rate input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Annual Electricity Rate Increase (%)
            <span className="ml-2 text-xs font-normal text-gray-500">(Historical average is 3-5%)</span>
          </label>
          <input
            type="number"
            value={annualEscalatorInput}
            onChange={(e) => {
              const value = e.target.value
              // Allow empty string, single decimal point, or valid numbers
              if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
                setAnnualEscalatorInput(value)
                // Update the number state if it's a valid number
                const numValue = parseFloat(value)
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
                  console.log('[StepEnergySimple] Annual escalator input changed to:', numValue)
                  setAnnualEscalator(numValue)
                  // Also call the handler to ensure consistency
                  handleAnnualEscalatorChange(numValue)
                }
              }
            }}
            onBlur={(e) => {
              const value = parseFloat(e.target.value)
              if (isNaN(value) || value < 0) {
                console.log('[StepEnergySimple] Annual escalator onBlur - resetting to 4.5')
                setAnnualEscalatorInput('4.5')
                setAnnualEscalator(4.5)
                handleAnnualEscalatorChange(4.5)
              } else if (value > 20) {
                console.log('[StepEnergySimple] Annual escalator onBlur - capping at 20')
                setAnnualEscalatorInput('20')
                setAnnualEscalator(20)
                handleAnnualEscalatorChange(20)
              } else {
                console.log('[StepEnergySimple] Annual escalator onBlur - finalizing:', value)
                setAnnualEscalatorInput(value.toString())
                setAnnualEscalator(value)
                handleAnnualEscalatorChange(value)
              }
            }}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            placeholder="4.5"
            min="0"
            max="20"
            step="0.1"
          />
        </div>

        {/* User data accuracy disclaimer */}
        <div className="mb-6 flex items-start gap-2 text-xs text-gray-600">
          <InfoTooltip
            content="Results rely on the information entered by the user. Incorrect or incomplete details—such as power usage, monthly bill amounts, or rate assumptions—will impact the accuracy of the estimates."
          />
          <span>Estimates depend on your usage, bill amounts, and rate assumptions being accurate.</span>
        </div>

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

