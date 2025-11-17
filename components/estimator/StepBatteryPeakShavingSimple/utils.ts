// Utility functions for StepBatteryPeakShavingSimple component

export type LeftoverBreakdown = {
  ultraLow?: number
  offPeak: number
  midPeak: number
  onPeak: number
}

/**
 * Clamps breakdown values to match a target total while respecting caps
 */
export function clampBreakdown(
  breakdown: LeftoverBreakdown | undefined,
  targetTotal: number,
  order: Array<'ultraLow' | 'offPeak' | 'midPeak' | 'onPeak'>,
  caps?: Partial<Record<'ultraLow' | 'offPeak' | 'midPeak' | 'onPeak', number>>
): LeftoverBreakdown {
  const safeBreakdown: LeftoverBreakdown = {
    ultraLow: Math.max(0, breakdown?.ultraLow ?? 0),
    offPeak: Math.max(0, breakdown?.offPeak ?? 0),
    midPeak: Math.max(0, breakdown?.midPeak ?? 0),
    onPeak: Math.max(0, breakdown?.onPeak ?? 0),
  }

  if (targetTotal <= 0) {
    return {
      ultraLow: 0,
      offPeak: 0,
      midPeak: 0,
      onPeak: 0,
    }
  }

  let remaining = targetTotal
  const result: LeftoverBreakdown = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }

  // First pass respects caps (max shift per period)
  order.forEach(period => {
    if (remaining <= 0) return
    const available = safeBreakdown[period] ?? 0
    if (available <= 0) return
    const cap = caps?.[period]
    const allowed = cap != null ? Math.max(0, Math.min(cap, available)) : available
    if (allowed <= 0) return
    const allocation = Math.min(allowed, remaining)
    result[period] = allocation
    remaining -= allocation
  })

  // Second pass uses any leftover room without caps so totals always reconcile
  if (remaining > 0) {
    order.forEach(period => {
      if (remaining <= 0) return
      const available = safeBreakdown[period] ?? 0
      const alreadyAllocated = result[period] ?? 0
      const spaceLeft = Math.max(0, available - alreadyAllocated)
      if (spaceLeft <= 0) return
      const allocation = Math.min(spaceLeft, remaining)
      result[period] = alreadyAllocated + allocation
      remaining -= allocation
    })
  }

  return result
}

/**
 * Format usage share as percentage
 */
export function formatUsageShare(value?: number): string {
  return `${(value ?? 0).toFixed(1)}%`
}

/**
 * Format kWh value with locale formatting
 */
export function formatKwh(value: number): string {
  return `${Math.round(value).toLocaleString()} kWh`
}

/**
 * Format percentage value
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Calculate default usage from monthly bill
 */
export function calculateUsageFromBill(monthlyBill: number): number {
  const avgRate = 0.223
  const monthlyKwh = monthlyBill / avgRate
  return Math.round(monthlyKwh * 12)
}

