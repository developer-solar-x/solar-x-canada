# Peak-Shaving Battery Calculator

## Overview
The Peak-Shaving Battery Calculator is a comprehensive tool that helps homeowners understand the financial benefits of adding battery storage to their solar system. It uses AI-optimized dispatch logic to show how much money they can save by charging batteries during cheap hours and using stored energy during expensive peak hours.

## Features Implemented

### 1. Rate Plan Configuration (`config/rate-plans.ts`)
- **Ultra-Low Overnight (ULO)**: Best for EV owners and those who can shift usage
  - Ultra-Low: 3.9¢/kWh (11 PM - 7 AM daily)
  - Mid-Peak: 15.7¢/kWh (7 AM - 4 PM & 9 PM - 11 PM weekdays)
  - On-Peak: 39.1¢/kWh (4 PM - 9 PM weekdays)
  - Weekend: 9.8¢/kWh (all hours Sat/Sun)

- **Time-of-Use (TOU)**: Standard pricing for most households
  - Off-Peak: 9.8¢/kWh (evenings/nights + weekends)
  - Mid-Peak: 15.7¢/kWh (weekdays 11 AM - 5 PM)
  - On-Peak: 20.3¢/kWh (weekdays 7 AM - 11 AM & 5 PM - 7 PM)

### 2. Battery Specifications (`config/battery-specs.ts`)
Six battery options with complete specifications:

| Brand | Model | Nominal kWh | Usable kWh | Price | Rebate | Net Cost |
|-------|-------|-------------|------------|-------|---------|----------|
| Renon | 16 kWh | 16 | 14.4 | $8,000 | $4,800 | $3,200 |
| Renon | 32 kWh | 32 | 28.8 | $11,000 | $5,000 | $6,000 |
| Tesla | Powerwall 13.5 | 13.5 | 12.825 | $19,000 | $4,050 | $14,950 |
| Growatt | 10 kWh | 10 | 9.0 | $10,000 | $3,000 | $7,000 |
| Growatt | 15 kWh | 15 | 13.5 | $13,000 | $4,500 | $8,500 |
| Growatt | 20 kWh | 20 | 18.0 | $16,000 | $5,000 | $11,000 |

**Rebate Formula**: `min(nominal_kWh × $300, $5,000)`

### 3. Battery Dispatch Optimization (`lib/battery-dispatch.ts`)
AI-optimized dispatch logic that:
- Automatically charges batteries during cheapest hours
- Discharges during most expensive hours
- Respects battery capacity, efficiency, and power limits
- Performs one full cycle per day
- Skips weekends for ULO (no on-peak savings opportunity)

**Optimization Algorithm**:
1. Identifies cheapest charging hours (typically 11 PM - 7 AM)
2. Identifies most expensive discharge hours (typically 4 PM - 9 PM)
3. Calculates optimal charge/discharge amounts
4. Simulates hour-by-hour operation
5. Computes before/after costs

### 4. Multi-Year Projection (`lib/battery-dispatch.ts`)
- 25-year savings forecast
- 5% annual rate escalation
- Payback period calculation
- ROI analysis
- Cumulative savings tracking

### 5. Usage Data Handling (`lib/usage-parser.ts`)
Three input methods:
1. **Green Button CSV**: Import actual utility data
2. **Manual Monthly Entry**: Enter monthly kWh totals
3. **Annual Fallback**: Generate realistic hourly patterns from annual total

Features:
- Validation and cleaning
- Gap detection
- Aggregation (hourly → daily → monthly)
- Export to CSV

### 6. User Interface Components

#### Battery Comparison Component (`components/estimator/StepBatteryPeakShaving.tsx`)
Interactive interface with:
- Rate plan selector (ULO vs TOU)
- Annual usage input
- Multi-battery comparison
- Side-by-side financial analysis
- Real-time calculations

**Displays for each battery**:
- Net cost after rebate
- Year 1 savings
- 25-year total savings
- Payback period
- Annual ROI percentage
- kWh shifted per year
- Number of cycles per year

#### Visualization Component (`components/estimator/PeakShavingCharts.tsx`)
Beautiful charts and visualizations:
- Monthly savings bar chart
- 25-year cumulative savings line chart
- Before/after bill comparison
- Break-even indicator
- "How it works" educational section

### 7. Integration with Estimator Flow
The peak-shaving calculator is integrated as **Step 5** (Battery Savings) in both Easy and Detailed modes:
- Only shows if battery is selected in Add-ons step
- Automatically skipped if no battery
- Seamless navigation forward/backward
- Data persists in estimator state

## Usage Flow

1. **User selects battery in Add-ons step**
2. **System detects battery selection**
3. **Shows Peak-Shaving Battery Calculator**
4. **User inputs/confirms annual usage**
5. **User selects rate plan (ULO or TOU)**
6. **User selects batteries to compare**
7. **System calculates and displays**:
   - Optimized dispatch schedule
   - First year savings
   - 25-year projections
   - Payback period
   - ROI metrics
8. **User reviews comparison and continues**

## Technical Details

### Calculation Performance
- Optimizes 365 days of hourly data (8,760 data points)
- Compares multiple batteries simultaneously
- Real-time UI updates
- Efficient caching of intermediate results

### Data Structures
```typescript
// Usage data point
interface UsageDataPoint {
  timestamp: Date
  kwh: number
  rate: number
  period: RatePeriod
}

// Battery comparison result
interface BatteryComparison {
  battery: BatterySpec
  firstYearAnalysis: AnnualDispatchAnalysis
  multiYearProjection: MultiYearProjection
  metrics: {
    savingsPerDollarInvested: number
    paybackYears: number
    annualROI: number
  }
}
```

### Assumptions
- One full battery cycle per day
- Weekday/weekend patterns
- Ontario holidays treated as weekends
- Round-trip efficiency losses included
- Inverter power limits respected
- 5% annual electricity rate increase

## Future Enhancements
Potential additions:
- Solar + battery combined optimization
- Time-shifting beyond peak shaving
- Grid export scenarios
- Backup power calculations
- Seasonal pattern adjustments
- Real-time rate updates
- PDF export of analysis
- Email delivery of results

## Configuration
All rates and battery specs are JSON-configurable:
- Update `config/rate-plans.ts` for new rates
- Update `config/battery-specs.ts` for new batteries
- No code changes needed for rate/pricing updates

## API Integration
The calculator can be enhanced with:
- Real utility rate APIs
- Green Button Connect integration
- Live weather data for solar production
- Battery warranty tracking
- Utility program eligibility

## Educational Value
The calculator helps homeowners understand:
- How time-of-use rates work
- The value of energy storage
- Peak shaving vs net metering
- Long-term financial benefits
- Environmental impact

## Support
For questions or issues with the peak-shaving calculator, review:
- This documentation
- Code comments in each module
- Example usage in test files
- Integration points in estimator flow

