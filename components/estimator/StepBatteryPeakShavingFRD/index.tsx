'use client'

import { useState, useEffect, useCallback } from 'react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { PeakShavingSalesCalculatorFRD } from '../PeakShavingSalesCalculatorFRD'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'
import { isValidEmail } from '@/lib/utils'

export function StepBatteryPeakShavingFRD({ data, onComplete, onBack, manualMode = false }: StepBatteryPeakShavingSimpleProps) {
  // System size customization state (mirrors simple battery step)
  const panelWattage = data.estimate?.system?.panelWattage || 500
  const initialPanels = data.solarOverride?.numPanels ?? data.estimate?.system?.numPanels ?? 0
  const [solarPanels, setSolarPanels] = useState<number>(initialPanels)
  const [overrideEstimate, setOverrideEstimate] = useState<any>(null)
  const [overrideEstimateLoading, setOverrideEstimateLoading] = useState(false)
  const [initialEstimate, setInitialEstimate] = useState<any>(data.estimate)

  // Round to nearest 0.5 kW to match StepReview display
  const systemSizeKwOverride = solarPanels > 0
    ? Math.round(((solarPanels * panelWattage) / 1000) * 2) / 2
    : 0
  const effectiveSystemSizeKw = systemSizeKwOverride || initialEstimate?.system?.sizeKw || 0

  // Save progress to partial leads when the user continues
  const saveProgressToPartialLead = useCallback(async (stepData: any) => {
    const email = data.email
    if (!email || !isValidEmail(email)) return

    try {
      const response = await fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: {
            ...data,
            ...stepData,
            email,
          },
          currentStep: 4, // Battery Savings (FRD) step
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Failed to save partial lead (FRD step 4):', response.status, err)
        return
      }

      const result = await response.json().catch(() => null)
      console.log('Partial lead saved/updated from FRD step 4:', result?.id || '(no id returned)')
    } catch (error) {
      console.error('Failed to save progress (FRD step 4):', error)
    }
  }, [data])

  // Generate initial estimate if missing or when bill/usage changes from Step 3
  useEffect(() => {
    if (!data?.coordinates) return

    if (!data.roofAreaSqft && !data.monthlyBill && !data.energyUsage?.annualKwh) {
      return
    }

    const generateInitialEstimate = async () => {
      try {
        setOverrideEstimateLoading(true)
        const resp = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: data.coordinates,
            roofPolygon: data.roofPolygon,
            roofType: data.roofType || 'asphalt_shingle',
            roofAge: data.roofAge || '0-5',
            roofPitch: data.roofPitch || 'medium',
            shadingLevel: data.shadingLevel || 'minimal',
            monthlyBill: data.monthlyBill,
            annualUsageKwh: data.energyUsage?.annualKwh || data.annualUsageKwh,
            energyUsage: data.energyUsage,
            province: data.province || 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            roofAreaSqft: data.roofAreaSqft,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          setInitialEstimate(json.data)
          if (!solarPanels || solarPanels === 0) {
            setSolarPanels(json.data?.system?.numPanels || 0)
          }
        }
      } catch (e) {
        console.warn('Initial estimate generation failed (FRD)', e)
      } finally {
        setOverrideEstimateLoading(false)
      }
    }

    const timeoutId = setTimeout(generateInitialEstimate, 500)
    return () => clearTimeout(timeoutId)
  }, [
    data.coordinates,
    data.roofPolygon,
    data.roofType,
    data.roofAge,
    data.roofPitch,
    data.shadingLevel,
    data.monthlyBill,
    data.energyUsage?.annualKwh,
    data.annualUsageKwh,
    data.roofAzimuth,
    data.roofAreaSqft,
    solarPanels,
  ])

  // When panel count changes, re-run estimate with override size to refresh annual kWh
  useEffect(() => {
    if (!data?.coordinates) {
      setOverrideEstimate(null)
      return
    }

    if (!solarPanels || solarPanels <= 0) {
      setOverrideEstimate(null)
      return
    }

    const run = async () => {
      try {
        setOverrideEstimateLoading(true)
        const resp = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: data.coordinates,
            roofPolygon: data.roofPolygon,
            roofType: data.roofType || 'asphalt_shingle',
            roofAge: data.roofAge || '0-5',
            roofPitch: data.roofPitch || 'medium',
            shadingLevel: data.shadingLevel || 'minimal',
            monthlyBill: data.monthlyBill,
            annualUsageKwh: data.energyUsage?.annualKwh || data.annualUsageKwh,
            energyUsage: data.energyUsage,
            province: data.province || 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            roofAreaSqft: data.roofAreaSqft,
            overrideSystemSizeKw: systemSizeKwOverride,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          setOverrideEstimate(json.data)
        }
      } catch (e) {
        console.warn('Override estimate failed (FRD)', e)
      } finally {
        setOverrideEstimateLoading(false)
      }
    }

    const timeoutId = setTimeout(run, 500)
    return () => clearTimeout(timeoutId)
  }, [
    solarPanels,
    systemSizeKwOverride,
    data.coordinates,
    data.roofPolygon,
    data.roofType,
    data.roofAge,
    data.roofPitch,
    data.shadingLevel,
    data.monthlyBill,
    data.energyUsage,
    data.annualUsageKwh,
    data.roofAzimuth,
    data.roofAreaSqft,
  ])

  // Merge override estimate with data for FRD calculator
  const enhancedData = {
    ...data,
    estimate: overrideEstimate || initialEstimate || data.estimate,
    solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
  }

  /**
   * Handle completion from the FRD calculator UI.
   * The calculator already prepares a rich `peakShaving` payload (including TOU/ULO).
   * Here we:
   * - ensure annualUsageKwh and selectedBattery are set
   * - persist to partial leads (step 4)
   * - bubble the merged data up to the main estimator flow
   */
  const handleCalculatorComplete = (calculatorData: any) => {
    const annualUsageKwh =
      calculatorData?.peakShaving?.annualUsageKwh ||
      data.peakShaving?.annualUsageKwh ||
      data.energyUsage?.annualKwh ||
      data.annualUsageKwh ||
      14000

    const selectedBattery =
      calculatorData?.peakShaving?.selectedBattery ||
      calculatorData?.selectedBattery ||
      data.selectedBattery ||
      undefined

    const stepData = {
      // Preserve everything coming from the calculator (peakShaving, selectedBatteryIds, TOU/ULO, etc.)
      ...calculatorData,
      // Keep solar override in sync with current panel slider
      solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
      peakShaving: {
        ...(calculatorData?.peakShaving || {}),
        annualUsageKwh,
        selectedBattery,
      },
      selectedBattery,
    }

    // Save partial lead for step 4 (Battery Savings)
    void saveProgressToPartialLead(stepData)

    onComplete({
      ...data,
      ...stepData,
    })
  }

  return (
    <div className="w-full min-h-screen">
      {/* FRD Calculator - Standalone */}
      <div className="pt-2">
        <PeakShavingSalesCalculatorFRD
          data={enhancedData}
          onComplete={handleCalculatorComplete}
          onBack={onBack}
          manualMode={manualMode}
          solarPanels={solarPanels}
          onSolarPanelsChange={setSolarPanels}
          overrideEstimateLoading={overrideEstimateLoading}
          effectiveSystemSizeKw={effectiveSystemSizeKw}
          panelWattage={panelWattage}
        />
      </div>

      {/* Battery performance & optimization disclaimer */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-700">
          <InfoTooltip
            content="Battery performance, backup duration, and savings vary based on selected loads, weather conditions, solar production, consumption patterns, and equipment model. Optimization algorithms or AI-based controls may improve performance but cannot be guaranteed."
          />
          <span>
            Battery backup time and savings depend on your usage, weather, and chosen equipment.
          </span>
        </div>
      </div>
    </div>
  )
}
