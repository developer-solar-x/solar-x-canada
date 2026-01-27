/**
 * Shared production range rule for all calculator steps.
 * Minimum = 110% of base estimate, maximum = 119% of base.
 * Used consistently in Net Metering, Battery Peak Shaving, and Sales Calculator.
 */

export const PRODUCTION_RANGE_MIN_MULTIPLIER = 1.10
export const PRODUCTION_RANGE_MAX_MULTIPLIER = 1.19

export function getProductionRange(baseProductionKwh: number): { min: number; max: number } {
  const base = Math.round(baseProductionKwh)
  if (base <= 0) return { min: 0, max: 0 }
  return {
    min: Math.round(base * PRODUCTION_RANGE_MIN_MULTIPLIER),
    max: Math.round(base * PRODUCTION_RANGE_MAX_MULTIPLIER),
  }
}

/** Returns formatted "min - max kWh" or "0" when base is zero. */
export function formatProductionRange(baseProductionKwh: number, options?: { includeUnit?: boolean }): string {
  const { min, max } = getProductionRange(baseProductionKwh)
  if (min === 0 && max === 0) return options?.includeUnit === false ? '0' : '0 kWh'
  const formatted = `${min.toLocaleString()} - ${max.toLocaleString()}`
  return options?.includeUnit === false ? formatted : `${formatted} kWh`
}
