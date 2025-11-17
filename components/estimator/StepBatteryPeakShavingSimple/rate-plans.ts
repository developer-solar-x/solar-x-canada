// Custom rate plan creation logic

import { TOU_RATE_PLAN, ULO_RATE_PLAN, RatePlan } from '@/config/rate-plans'

export interface CustomRates {
  ulo: {
    ultraLow: number
    midPeak: number
    onPeak: number
    weekendOffPeak: number
  }
  tou: {
    offPeak: number
    midPeak: number
    onPeak: number
  }
}

/**
 * Create custom TOU rate plan with user's editable rates
 */
export function getCustomTouRatePlan(customRates: CustomRates['tou']): RatePlan {
  return {
    ...TOU_RATE_PLAN,
    periods: TOU_RATE_PLAN.periods.map(period => ({
      ...period,
      rate: period.period === 'off-peak' ? customRates.offPeak :
            period.period === 'mid-peak' ? customRates.midPeak :
            customRates.onPeak
    })),
    weekendRate: customRates.offPeak
  }
}

/**
 * Create custom ULO rate plan with user's editable rates
 */
export function getCustomUloRatePlan(customRates: CustomRates['ulo']): RatePlan {
  return {
    ...ULO_RATE_PLAN,
    periods: ULO_RATE_PLAN.periods.map(period => ({
      ...period,
      rate: period.period === 'ultra-low' ? customRates.ultraLow :
            period.period === 'mid-peak' ? customRates.midPeak :
            customRates.onPeak
    })),
    weekendRate: customRates.weekendOffPeak
  }
}

/**
 * Default custom rates matching OEB defaults
 */
export const DEFAULT_CUSTOM_RATES: CustomRates = {
  ulo: {
    ultraLow: 3.9,
    midPeak: 15.7,
    onPeak: 39.1,
    weekendOffPeak: 9.8
  },
  tou: {
    offPeak: 9.8,
    midPeak: 15.7,
    onPeak: 20.3
  }
}

