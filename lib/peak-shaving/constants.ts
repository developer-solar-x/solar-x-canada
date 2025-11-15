// Constants and default values for peak-shaving calculations

import type { UsageDistribution } from './types'

// Default distribution patterns for TOU and ULO
export const DEFAULT_TOU_DISTRIBUTION: UsageDistribution = {
  onPeakPercent: 19, // Weekday on-peak share for TOU solar+battery scenario
  midPeakPercent: 18, // Weekday mid-peak share for TOU solar+battery scenario
  offPeakPercent: 63 // Weekend/night off-peak (remainder to total 100%)
}

export const DEFAULT_ULO_DISTRIBUTION: UsageDistribution = {
  onPeakPercent: 17.9, // Weekday on-peak share used in the email baseline
  midPeakPercent: 33.1, // Weekday mid-peak share used in the email baseline
  offPeakPercent: 23, // Weekend/off-peak share used in the email baseline
  ultraLowPercent: 26 // Overnight ultra-low share used in the email baseline
}

// FRD Section 5.2: Day/Night split constants (default 50/50)
// These are adjustable constants for future rate-plan or province expansion
export const DEFAULT_DAY_NIGHT_SPLIT = {
  p_day: 0.5,    // 50% of usage during daytime
  p_night: 0.5   // 50% of usage during nighttime
}

// FRD Section 5.1: Battery constants
export const CMAX = 365  // Maximum cycles per year

// Preferred solar allocation weights for the ULO solar + battery scenario (client supplied)
export const ULO_SOLAR_ALLOCATION = {
  midPeak: 0.5, // 50% of the capped solar is aimed at weekday mid-peak
  onPeak: 0.22, // 22% of the capped solar offsets weekday on-peak
  offPeak: 0.28, // 28% of the capped solar smooths out weekend off-peak
  ultraLow: 0, // Overnight usage is left for the battery to cover via charging strategy
} as const

// TOU allocation weights provided for solar + battery modelling
export const TOU_SOLAR_ALLOCATION = {
  midPeak: 0.5, // 50% of the capped solar focuses on weekday mid-peak
  onPeak: 0.22, // 22% targets the weekday on-peak windows
  offPeak: 0.28, // 28% covers weekend/off-peak periods
  ultraLow: 0, // No solar energy applied to ultra-low since production happens during the day
} as const

// FRD ULO Formula Constants
export const ULO_FRD_CONSTANTS = {
  MAX_SOLAR_TO_BATTERY_KWH: 2000, // FRD cap: Solar → Battery ≤ 2,000 kWh/year
  MAX_ULO_TO_BATTERY_KWH: 3000, // FRD cap: ULO → Battery ≤ 3,000 kWh/year
  MIN_GRID_PURCHASES_PERCENT: 0.10, // FRD: Grid purchases ≥ 10%
  MAX_OFFSET_PERCENT: 0.85, // FRD: Offset ≤ 85%
  MAX_SOLAR_TO_BATTERY_WINTER: 200, // FRD: SolarToBatteryWinter ≤ 200 kWh
  MAX_SOLAR_TO_BATTERY_SUMMER: 1800, // FRD: SolarToBatterySummer ≤ 1,800 kWh
  WINTER_SOLAR_PERCENT: 0.35, // Winter (Oct–Mar): 35% of solar
  SUMMER_SOLAR_PERCENT: 0.65, // Summer (Apr–Sep): 65% of solar
  TARGET_SOLAR_DIRECT_PERCENT: 0.5, // 50% of usage covered by solar direct
  TARGET_SOLAR_TO_BATTERY_PERCENT: 0.2, // 20% of usage from solar-charged battery
  TARGET_ULO_TO_BATTERY_PERCENT: 0.3, // 30% of usage from ULO-charged battery
  BASELINE_USAGE_KWH: 10000, // 10k baseline for scaling
} as const

