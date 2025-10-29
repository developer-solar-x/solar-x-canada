// Ontario Energy Board (OEB) Rate Plans
// Effective November 1, 2025
// All rates in cents per kWh

// Day of week enum for clarity
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

// Rate period types
export type RatePeriod = 'ultra-low' | 'off-peak' | 'mid-peak' | 'on-peak'

// Time period definition structure
export interface TimePeriod {
  startHour: number // 24-hour format (0-23)
  endHour: number // 24-hour format (0-23)
  days: DayOfWeek[] // Days this period applies to
  rate: number // Rate in cents per kWh
  period: RatePeriod
}

// Rate plan structure
export interface RatePlan {
  id: string
  name: string
  description: string
  effectiveDate: string
  periods: TimePeriod[]
  weekendRate?: number // Simplified weekend rate if applicable
  weekendPeriod?: RatePeriod
}

// Ontario statutory holidays (treat as weekends for rate purposes)
// These should be updated annually
export const ONTARIO_HOLIDAYS_2025: string[] = [
  '2025-01-01', // New Year's Day
  '2025-02-17', // Family Day
  '2025-04-18', // Good Friday
  '2025-05-19', // Victoria Day
  '2025-07-01', // Canada Day
  '2025-08-04', // Civic Holiday
  '2025-09-01', // Labour Day
  '2025-10-13', // Thanksgiving
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day
]

// Helper function to check if a date is a weekend or holiday
export function isWeekendOrHoliday(date: Date): boolean {
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === DayOfWeek.SUNDAY || dayOfWeek === DayOfWeek.SATURDAY
  
  // Check if date is a holiday
  // Use local date string to avoid timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`
  const isHoliday = ONTARIO_HOLIDAYS_2025.includes(dateString)
  
  return isWeekend || isHoliday
}

// Ultra-Low Overnight (ULO) Rate Plan
// Effective November 1, 2025
export const ULO_RATE_PLAN: RatePlan = {
  id: 'ulo',
  name: 'Ultra-Low Overnight (ULO)',
  description: 'Best for EV owners and those who can shift usage to overnight hours',
  effectiveDate: '2025-11-01',
  weekendRate: 9.8, // All hours on weekends
  weekendPeriod: 'off-peak',
  periods: [
    // Weekday periods
    {
      startHour: 23, // 11:00 PM
      endHour: 7, // 7:00 AM (wraps to next day)
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 3.9,
      period: 'ultra-low'
    },
    {
      startHour: 7, // 7:00 AM
      endHour: 16, // 4:00 PM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 15.7,
      period: 'mid-peak'
    },
    {
      startHour: 16, // 4:00 PM
      endHour: 21, // 9:00 PM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 39.1,
      period: 'on-peak'
    },
    {
      startHour: 21, // 9:00 PM
      endHour: 23, // 11:00 PM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 15.7,
      period: 'mid-peak'
    }
  ]
}

// Time-of-Use (TOU) Rate Plan
// Effective November 1, 2025
export const TOU_RATE_PLAN: RatePlan = {
  id: 'tou',
  name: 'Time-of-Use (TOU)',
  description: 'Standard time-based pricing for most households',
  effectiveDate: '2025-11-01',
  weekendRate: 9.8, // All hours on weekends
  weekendPeriod: 'off-peak',
  periods: [
    // Weekday periods
    {
      startHour: 0, // 12:00 AM
      endHour: 7, // 7:00 AM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 9.8,
      period: 'off-peak'
    },
    {
      startHour: 7, // 7:00 AM
      endHour: 11, // 11:00 AM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 20.3,
      period: 'on-peak'
    },
    {
      startHour: 11, // 11:00 AM
      endHour: 17, // 5:00 PM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 15.7,
      period: 'mid-peak'
    },
    {
      startHour: 17, // 5:00 PM
      endHour: 19, // 7:00 PM
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 20.3,
      period: 'on-peak'
    },
    {
      startHour: 19, // 7:00 PM
      endHour: 24, // 12:00 AM (midnight)
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
      rate: 9.8,
      period: 'off-peak'
    }
  ]
}

// All available rate plans
export const RATE_PLANS: RatePlan[] = [ULO_RATE_PLAN, TOU_RATE_PLAN]

// Get rate for a specific date and hour
export function getRateForDateTime(ratePlan: RatePlan, date: Date, hour: number): {
  rate: number
  period: RatePeriod
} {
  // Check if it's a weekend or holiday - use simplified weekend rate
  if (isWeekendOrHoliday(date) && ratePlan.weekendRate !== undefined) {
    return {
      rate: ratePlan.weekendRate,
      period: ratePlan.weekendPeriod || 'off-peak'
    }
  }
  
  const dayOfWeek = date.getDay()
  
  // Find matching period for this day and hour
  for (const period of ratePlan.periods) {
    // Check if day matches
    if (!period.days.includes(dayOfWeek)) {
      continue
    }
    
    // Handle periods that wrap around midnight (e.g., 23:00 to 7:00)
    if (period.startHour > period.endHour) {
      // Period wraps around midnight
      if (hour >= period.startHour || hour < period.endHour) {
        return {
          rate: period.rate,
          period: period.period
        }
      }
    } else {
      // Normal period within same day
      if (hour >= period.startHour && hour < period.endHour) {
        return {
          rate: period.rate,
          period: period.period
        }
      }
    }
  }
  
  // Fallback to off-peak rate if no match found
  return {
    rate: ratePlan.weekendRate || 9.8,
    period: 'off-peak'
  }
}

// Calculate total cost for usage data with a given rate plan
export function calculateCostWithRatePlan(
  ratePlan: RatePlan,
  usageData: Array<{ timestamp: Date; kwh: number }>
): {
  totalCost: number
  costByPeriod: Record<RatePeriod, number>
  usageByPeriod: Record<RatePeriod, number>
} {
  // Initialize counters
  const costByPeriod: Record<RatePeriod, number> = {
    'ultra-low': 0,
    'off-peak': 0,
    'mid-peak': 0,
    'on-peak': 0
  }
  
  const usageByPeriod: Record<RatePeriod, number> = {
    'ultra-low': 0,
    'off-peak': 0,
    'mid-peak': 0,
    'on-peak': 0
  }
  
  let totalCost = 0
  
  // Process each usage entry
  for (const entry of usageData) {
    const hour = entry.timestamp.getHours()
    const { rate, period } = getRateForDateTime(ratePlan, entry.timestamp, hour)
    
    const cost = (entry.kwh * rate) / 100 // Convert cents to dollars
    
    totalCost += cost
    costByPeriod[period] += cost
    usageByPeriod[period] += entry.kwh
  }
  
  return {
    totalCost,
    costByPeriod,
    usageByPeriod
  }
}

// Get cheapest charging hours for a given rate plan
export function getCheapestChargingHours(
  ratePlan: RatePlan,
  hoursNeeded: number = 8
): Array<{ hour: number; rate: number; period: RatePeriod }> {
  // Create a typical weekday to analyze
  const testDate = new Date('2025-11-04') // A Monday
  
  // Get rates for all 24 hours
  const hourlyRates = []
  for (let hour = 0; hour < 24; hour++) {
    const { rate, period } = getRateForDateTime(ratePlan, testDate, hour)
    hourlyRates.push({ hour, rate, period })
  }
  
  // Sort by rate (cheapest first)
  hourlyRates.sort((a, b) => a.rate - b.rate)
  
  // Return the cheapest hours needed
  return hourlyRates.slice(0, hoursNeeded)
}

// Get most expensive discharge hours for a given rate plan
export function getMostExpensiveDischargeHours(
  ratePlan: RatePlan,
  hoursNeeded: number = 5
): Array<{ hour: number; rate: number; period: RatePeriod }> {
  // Create a typical weekday to analyze
  const testDate = new Date('2025-11-04') // A Monday
  
  // Get rates for all 24 hours
  const hourlyRates = []
  for (let hour = 0; hour < 24; hour++) {
    const { rate, period } = getRateForDateTime(ratePlan, testDate, hour)
    hourlyRates.push({ hour, rate, period })
  }
  
  // Sort by rate (most expensive first)
  hourlyRates.sort((a, b) => b.rate - a.rate)
  
  // Return the most expensive hours needed
  return hourlyRates.slice(0, hoursNeeded)
}

