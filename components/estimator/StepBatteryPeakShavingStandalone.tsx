'use client'

// Standalone Peak-Shaving Calculator wrapper component
// This isolates the standalone behavior from the shared simple component,
// avoiding any changes or flags in the existing estimator flow.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateSystemCost } from '@/config/pricing'
import { StepBatteryPeakShavingSimple } from './StepBatteryPeakShavingSimple'

interface Props {
  onBack?: () => void
}

export function StepBatteryPeakShavingStandalone({ onBack }: Props) {
  const handleComplete = useCallback(() => {
    // No-op in standalone; results are for on-screen review
  }, [])

  const handleBack = useCallback(() => {
    if (onBack) return onBack()
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back()
      else window.location.href = '/'
    }
  }, [onBack])

  // Hide navigation buttons that belong to the shared component in standalone context
  useEffect(() => {
    const hideNav = () => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      buttons.forEach(btn => {
        if (btn.textContent && btn.textContent.includes('Continue to Next Step')) {
          btn.style.display = 'none'
        }
      })
    }
    hideNav()
    const observer = new MutationObserver(hideNav)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  // Standalone manual inputs
  const [panelWattage] = useState<number>(500)
  const [sizeKw, setSizeKw] = useState<number>(7.5)
  const [numPanels, setNumPanels] = useState<number>(Math.round((7.5 * 1000) / panelWattage))
  const [annualProductionKwh, setAnnualProductionKwh] = useState<number>(13860)

  // After mount, hydrate from localStorage to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return
    const s = Number(localStorage.getItem('ps_sizeKw') || '0')
    const p = Number(localStorage.getItem('ps_numPanels') || '0')
    const ap = Number(localStorage.getItem('ps_annualProductionKwh') || '0')
    if (s > 0) setSizeKw(s)
    if (p > 0) setNumPanels(p)
    if (ap > 0) setAnnualProductionKwh(ap)
  }, [])
  const blendedRate = 0.277

  // Keep size and panel count in sync (simple linkage)
  const onSizeChange = (v: number) => {
    const s = Math.max(0, v || 0)
    setSizeKw(s)
    setNumPanels(Math.max(0, Math.round((s * 1000) / panelWattage)))
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_sizeKw', String(s))
      localStorage.setItem('ps_numPanels', String(Math.max(0, Math.round((s * 1000) / panelWattage))))
    }
  }
  const onPanelsChange = (v: number) => {
    const p = Math.max(0, Math.floor(v || 0))
    setNumPanels(p)
    setSizeKw(Math.round(((p * panelWattage) / 1000) * 10) / 10)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_numPanels', String(p))
      localStorage.setItem('ps_sizeKw', String(Math.round(((p * panelWattage) / 1000) * 10) / 10))
    }
  }
  // Persist annual production
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_annualProductionKwh', String(Math.max(0, annualProductionKwh || 0)))
    }
  }, [annualProductionKwh])

  const estimateData = useMemo(() => {
    const annualSolarSavings = Math.max(0, annualProductionKwh * blendedRate)
    const totalCost = calculateSystemCost(sizeKw)
    const rebate = Math.min(sizeKw * 1000, 5000)
    const netCost = Math.max(0, totalCost - rebate)
    return {
      system: { sizeKw, numPanels, panelWattage },
      production: { annualKwh: annualProductionKwh },
      costs: { totalCost, netCost, incentives: rebate },
      savings: { annualSavings: annualSolarSavings, monthlySavings: Math.round(annualSolarSavings / 12) },
    }
  }, [sizeKw, numPanels, panelWattage, annualProductionKwh])

  return (
    <StepBatteryPeakShavingSimple
      data={{ estimate: estimateData }}
      onComplete={handleComplete}
      onBack={handleBack}
      allowManualSolar
    />
  )
}


