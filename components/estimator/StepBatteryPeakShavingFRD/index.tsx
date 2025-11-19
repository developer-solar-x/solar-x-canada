'use client'

// Step Component Wrapper for PeakShavingSalesCalculatorFRD
// This adds navigation buttons (Back/Continue) and system size customization
// The FRD calculator remains standalone and manages its own state

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PeakShavingSalesCalculatorFRD } from '../PeakShavingSalesCalculatorFRD'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'

export function StepBatteryPeakShavingFRD({ data, onComplete, onBack, manualMode = false }: StepBatteryPeakShavingSimpleProps) {
  // System size customization state
  const panelWattage = data.estimate?.system?.panelWattage || 500
  const initialPanels = data.solarOverride?.numPanels ?? data.estimate?.system?.numPanels ?? 0
  const [solarPanels, setSolarPanels] = useState<number>(initialPanels)
  const [overrideEstimate, setOverrideEstimate] = useState<any>(null)
  const [overrideEstimateLoading, setOverrideEstimateLoading] = useState(false)
  const [initialEstimate, setInitialEstimate] = useState<any>(data.estimate)
  
  const systemSizeKwOverride = solarPanels > 0 ? Math.round(((solarPanels * panelWattage) / 1000) * 10) / 10 : 0
  const effectiveSystemSizeKw = systemSizeKwOverride || initialEstimate?.system?.sizeKw || 0

  // Generate initial estimate if missing or when monthlyBill/usage changes from Step 3
  useEffect(() => {
    if (!data?.coordinates) {
      return
    }
    
    // Don't generate if we're missing critical data
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
            province: 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            roofAreaSqft: data.roofAreaSqft,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          setInitialEstimate(json.data)
          // If no panel override, also update solar panels to match estimate
          if (!solarPanels || solarPanels === 0) {
            setSolarPanels(json.data?.system?.numPanels || 0)
          }
        }
      } catch (e) {
        console.warn('Initial estimate generation failed', e)
      } finally {
        setOverrideEstimateLoading(false)
      }
    }
    
    // Debounce to avoid too many API calls
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
    data.roofAreaSqft
  ])

  // When panel count changes, re-run estimate with override size to refresh annual kWh
  useEffect(() => {
    // Only run if we have coordinates and panels are set
    if (!data?.coordinates) {
      setOverrideEstimate(null)
      return
    }
    
    // If panels are 0 or not set, use original estimate
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
            province: 'ON',
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
        console.warn('Override estimate failed', e)
      } finally {
        setOverrideEstimateLoading(false)
      }
    }
    
    // Debounce the API call slightly to avoid too many requests
    const timeoutId = setTimeout(run, 500)
    return () => clearTimeout(timeoutId)
  }, [solarPanels, systemSizeKwOverride, data.coordinates, data.roofPolygon, data.roofType, data.roofAge, data.roofPitch, data.shadingLevel, data.monthlyBill, data.energyUsage, data.annualUsageKwh, data.roofAzimuth, data.roofAreaSqft])

  // Merge override estimate with data for FRD calculator
  const enhancedData = {
    ...data,
    estimate: overrideEstimate || initialEstimate || data.estimate,
    solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
  }

  const handleContinue = () => {
    // Extract data from localStorage (where FRD calculator stores its state)
    // or use props data as fallback
    const annualUsageKwh = data.peakShaving?.annualUsageKwh || 
                           data.energyUsage?.annualKwh || 
                           data.annualUsageKwh || 
                           14000
    
    const selectedBattery = data.selectedBattery || 'renon-16'
    
    // Pass through the data including solar override
    onComplete({
      ...data,
      solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
      peakShaving: {
        annualUsageKwh,
        selectedBattery,
        ratePlan: 'ULO', // Default
        comparisons: [],
      },
      selectedBattery,
    })
  }

  return (
    <div className="w-full">
      {/* Navigation Bar - Fixed at top */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40 py-3 shadow-sm">
        <div className="w-full max-w-none flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          )}
          <div className="flex-1" /> {/* Spacer */}
          {!manualMode && (
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* FRD Calculator - Standalone */}
      <PeakShavingSalesCalculatorFRD 
        data={enhancedData} 
        onComplete={onComplete} 
        onBack={onBack} 
        manualMode={manualMode}
        solarPanels={solarPanels}
        onSolarPanelsChange={setSolarPanels}
        overrideEstimateLoading={overrideEstimateLoading}
        effectiveSystemSizeKw={effectiveSystemSizeKw}
        panelWattage={panelWattage}
      />
    </div>
  )
}

