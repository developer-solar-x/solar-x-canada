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
export interface RatePlan { // Wrapping all plan details together for easier reuse
  id: string // Giving the plan a unique label so we can reference it elsewhere
  name: string // Keeping a friendly name for UI display
  description: string // Providing context for humans reading the configuration
  effectiveDate: string // Recording when these prices came into effect
  periods: TimePeriod[] // Listing all the weekday pricing windows for the plan
  weekendRate?: number // Offering a simple flat weekend price when detailed windows are not needed
  weekendPeriod?: RatePeriod // Tagging the flat weekend period with a label for reporting
  weekendPeriods?: TimePeriod[] // Allowing detailed weekend or holiday windows when the plan is more complex
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
  id: 'ulo', // Using a short identifier so other modules can detect this plan
  name: 'Ultra-Low Overnight (ULO)', // Leaving the friendly plan name intact for display
  description: 'Best for EV owners and those who can shift usage to overnight hours', // Summarizing the value proposition for this plan
  effectiveDate: '2025-11-01', // Documenting the start date of the published rates
  weekendRate: 9.8, // Keeping a fallback price in case detailed weekend windows are unavailable
  weekendPeriod: 'off-peak', // Tagging the fallback as an off-peak style rate
  weekendPeriods: [ // Outlining the exact weekend and holiday windows requested
    {
      startHour: 7, // Starting the daytime window right after the overnight period
      endHour: 23, // Ending the daytime window before the overnight period begins again
      days: [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY], // Listing the weekend days for clarity even though holidays reuse this logic
      rate: 9.8, // Applying the 9.8¢ daytime price shared in the brief
      period: 'off-peak' // Labeling the daytime price as off-peak for reporting
    },
    {
      startHour: 23, // Starting the overnight window at 11 PM
      endHour: 7, // Ending the overnight window at 7 AM on the following day
      days: [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY], // Mirroring the weekend list so the data stays self-explanatory
      rate: 3.9, // Enforcing the ultra-low 3.9¢ overnight price across weekends and holidays
      period: 'ultra-low' // Tagging this segment as ultra-low for downstream logic
    }
  ],
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

// Solar + battery tuned Time-of-Use plan crafted for peak shaving comparisons
export const TOU_SOLAR_BATTERY_PLAN: RatePlan = { // Packaging the specialized TOU settings for solar plus battery scenarios
  id: 'tou-solar-battery', // Giving the plan a unique name so future logic can spot it easily
  name: 'TOU Solar + Battery', // Sharing a friendly title that makes the intent obvious for readers
  description: 'Comparison baseline that blends solar production with TOU peak shaving', // Explaining the story in everyday language for clarity
  effectiveDate: '2025-11-01', // Reusing the current OEB schedule so stakeholders know the pricing vintage
  weekendRate: 9.8, // Keeping the same fallback rate to stay aligned with the official tariff today
  weekendPeriod: 'off-peak', // Tagging the fallback as off-peak to match reporting expectations
  periods: TOU_RATE_PLAN.periods.map(period => ({ // Borrowing the weekday structure so launch happens quickly while we wait for deeper modelling
    ...period, // Copying the base properties to avoid manual drift when the default plan updates
  })), // Returning the cloned periods so the object stays well formed
} // Closing out the TOU Solar + Battery definition before moving on

// Solar + battery tuned Ultra-Low Overnight plan shaped for combined system modelling
export const ULO_SOLAR_BATTERY_PLAN: RatePlan = { // Packaging the specialized ULO settings for solar plus battery comparisons
  id: 'ulo-solar-battery', // Assigning a clear identifier so calculations can key off this plan later
  name: 'ULO Solar + Battery', // Labeling the plan so the UI reads naturally to homeowners
  description: 'Comparison baseline that layers solar offsets onto the ULO overnight strategy', // Summing up the intent without technical jargon
  effectiveDate: '2025-11-01', // Staying consistent with the current posted rates until updates arrive
  weekendRate: 9.8, // Keeping a safety net value while the detailed weekend windows remain the same
  weekendPeriod: 'off-peak', // Tagging the fallback segment exactly like the base plan for continuity
  weekendPeriods: ULO_RATE_PLAN.weekendPeriods?.map(period => ({ // Cloning the weekend windows so behaviour matches the official structure
    ...period, // Copying each weekend entry to avoid editing multiple places when details evolve
  })), // Returning the replicated weekend array ready for future tweaks
  periods: ULO_RATE_PLAN.periods.map(period => ({ // Duplicating the weekday windows to keep schedules synchronised
    ...period, // Copying every property so nothing goes missing during the quick setup
  })), // Returning the array so this plan is immediately usable once logic appears
} // Sealing the ULO Solar + Battery definition until the dedicated logic arrives

// All available rate plans
export const RATE_PLANS: RatePlan[] = [ // Listing plans in one spot so selectors can stay in sync
  ULO_RATE_PLAN, // Keeping the standard ULO option available for regular comparisons
  TOU_RATE_PLAN, // Keeping the standard TOU option available right beside it
  ULO_SOLAR_BATTERY_PLAN, // Adding the new solar + battery ULO variant for combined modelling
  TOU_SOLAR_BATTERY_PLAN, // Adding the new solar + battery TOU variant for combined modelling
] // Wrapping up the array so downstream components can iterate cleanly

// Get rate for a specific date and hour
export function getRateForDateTime(ratePlan: RatePlan, date: Date, hour: number): {
  rate: number
  period: RatePeriod
} {
  // Check if it's a weekend or holiday - use simplified weekend rate
  if (isWeekendOrHoliday(date)) { // Detecting weekends or listed holidays so we can follow the alternate schedule
    if (ratePlan.weekendPeriods && ratePlan.weekendPeriods.length > 0) { // Confirming the plan supplied detailed weekend windows
      for (const period of ratePlan.weekendPeriods) { // Walking through each defined weekend window to find a match
        if (period.startHour > period.endHour) { // Handling windows that wrap past midnight
          const inOvernightWindow = hour >= period.startHour || hour < period.endHour // Testing whether the hour falls before or after midnight within the window
          if (inOvernightWindow) { // Returning the matching overnight window immediately
            return {
              rate: period.rate, // Passing back the matched rate for pricing calculations
              period: period.period // Passing back the descriptive label for reporting
            }
          }
        } else {
          const inDaytimeWindow = hour >= period.startHour && hour < period.endHour // Testing whether the hour falls inside a same-day window
          if (inDaytimeWindow) { // Returning the matching daytime window immediately
            return {
              rate: period.rate, // Passing back the matched rate for pricing calculations
              period: period.period // Passing back the descriptive label for reporting
            }
          }
        }
      }
    }
    
    if (ratePlan.weekendRate !== undefined) { // Falling back to the legacy single weekend price when detailed windows are absent
    return {
        rate: ratePlan.weekendRate, // Supplying the flat weekend price
        period: ratePlan.weekendPeriod || 'off-peak' // Defaulting the label to off-peak when nothing else is provided
      }
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

