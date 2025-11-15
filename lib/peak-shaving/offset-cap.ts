// Offset cap calculations for solar + battery systems

import type { SolarBatteryOffsetCapInput, SolarBatteryOffsetCapResult } from './types'

/**
 * Normalize azimuth value to 0-360 range
 */
function normalizeAzimuth(value: number): number {
  return ((value % 360) + 360) % 360
}

/**
 * Calculate angular difference between two azimuth values
 */
function angularDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeAzimuth(a) - normalizeAzimuth(b))
  return diff > 180 ? 360 - diff : diff
}

/**
 * Check if roof pitch is considered "steep" (≥35 degrees)
 */
function isSteepPitch(pitch?: string | number): boolean {
  if (typeof pitch === 'number') {
    return pitch >= 35
  }
  if (typeof pitch === 'string') {
    const normalized = pitch.toLowerCase()
    return (
      normalized.includes('steep') ||
      normalized.includes('40') ||
      normalized.includes('45')
    )
  }
  return false
}

/**
 * Resolve azimuth from input (checks multiple sources)
 */
function resolveAzimuth(input: SolarBatteryOffsetCapInput): number | undefined {
  if (typeof input.roofAzimuth === 'number' && Number.isFinite(input.roofAzimuth)) {
    return input.roofAzimuth
  }

  if (Array.isArray(input.roofSections)) {
    for (const section of input.roofSections) {
      if (typeof section?.azimuth === 'number') return section.azimuth
      if (typeof section?.orientationAzimuth === 'number')
        return section.orientationAzimuth
      if (
        typeof section?.direction === 'string' &&
        section.direction.toLowerCase().includes('south')
      )
        return 180
    }
  }

  return undefined
}

/**
 * Compute solar battery offset cap based on production-to-load ratio and roof characteristics
 */
export function computeSolarBatteryOffsetCap(
  input: SolarBatteryOffsetCapInput
): SolarBatteryOffsetCapResult {
  const usage = Math.max(0, input.usageKwh || 0)
  const production = Math.max(0, input.productionKwh || 0)

  if (usage === 0) {
    return {
      capFraction: 0,
      baseFraction: 0.92,
      matchesUsage: false,
      orientationBonus: false,
      productionBonus: false,
      productionToLoadRatio: 0,
    }
  }

  const ratio = production / usage
  const matchesUsage = ratio > 0.95 && ratio < 1.05

  const steep = isSteepPitch(input.roofPitch)
  const azimuth = resolveAzimuth(input)
  const orientationBonus =
    steep &&
    (typeof azimuth === 'number' ? angularDifference(azimuth, 180) <= 25 : false)

  const productionBonus = ratio >= 1.1

  let baseFraction = matchesUsage ? 0.9 : 0.92
  if (orientationBonus) baseFraction += 0.01
  if (productionBonus) baseFraction += 0.01

  const capFraction = Math.min(baseFraction, 0.93)

  return {
    capFraction,
    baseFraction: matchesUsage ? 0.9 : 0.92,
    matchesUsage,
    orientationBonus,
    productionBonus,
    productionToLoadRatio: ratio,
  }
}

