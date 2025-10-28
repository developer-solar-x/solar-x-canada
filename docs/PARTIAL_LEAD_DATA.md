# Partial Lead Data Capture

## Overview
Partial leads capture user progress early in the estimator to enable follow-up on abandoned estimates.

## When Email is Captured

**Trigger Point (Both Modes):** After **Step 3**
- **Easy Mode:** Step 3 = Energy
- **Detailed Mode:** Step 3 = Details

### Why Step 3?
- User has invested time (drawn roof, entered location)
- **Critical consumption data is captured EARLY** (monthly bill + usage)
- Higher data quality - captured before user fatigue sets in
- User hasn't seen results yet (maintains curiosity)
- Perfect timing for re-engagement if they abandon
- Prioritizes business-critical data over nice-to-have (photos)
- Ensures 100% of partial leads have consumption data needed for peak shaving

## Data Captured at Step 3

### ✅ What's Included in Partial Leads

| Field | Description | Why Important |
|-------|-------------|---------------|
| **email** | User's email address | Contact for follow-up |
| **address** | Property location | Lead qualification |
| **coordinates** | Lat/lng for property | Solar production estimates |
| **roofAreaSqft** | Roof size (sq ft) | System sizing |
| **roofPolygon** | Drawn roof geometry | Accurate estimates |
| **mapSnapshot** | Satellite image | Visual reference |
| **photos** | Property photos | Installation assessment |
| **monthlyBill** | Monthly electricity bill ($) | **Peak shaving calculations** |
| **homeSize** | Home size category | Usage verification |
| **specialAppliances** | EV, Pool, A/C, etc. | Load profiling |
| **energyUsage** | Annual/monthly/daily kWh | **Zero-export optimization** |

### 🔥 Critical for Peak Shaving

The consumption data captured at Step 4 enables:

1. **Peak Shaving Analysis**
   - Calculate TOU period usage
   - Optimize battery sizing
   - Estimate actual savings

2. **Battery Recommendations**
   ```typescript
   // Example: 10,000 kWh annual usage
   dailyConsumption = 27.4 kWh
   recommendedBattery = 16 kWh (covers evening peak)
   ```

3. **Lead Qualification**
   - High consumption = higher value
   - Identifies good candidates for battery systems
   - Enables accurate ROI calculations

4. **Zero-Export Incentive Eligibility**
   - Solar incentive: $100/kW (max $5,000)
   - Battery incentive: $300/kWh (max $5,000)
   - Requires consumption data for sizing

## Example Partial Lead Data

```json
{
  "email": "john@example.com",
  "address": "123 Main St, Toronto, ON",
  "coordinates": { "lat": 43.6532, "lng": -79.3832 },
  "roofAreaSqft": 2000,
  "monthlyBill": 180,
  "energyUsage": {
    "annualKwh": 10000,
    "monthlyKwh": 833,
    "dailyKwh": 27
  },
  "homeSize": "3-4br",
  "specialAppliances": ["ev", "ac"],
  "estimatorMode": "easy",
  "currentStep": 4,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Usage in Peak Shaving Calculator

With this data, you can immediately calculate:

```typescript
import { analyzeZeroExportSystem } from '@/lib/peak-shaving'

const analysis = analyzeZeroExportSystem(
  10000,  // Annual consumption (from partial lead)
  8.5,    // Recommended system size
  10200,  // Expected solar production
  16,     // Recommended battery size
  25000   // System cost
)

// Returns:
// - TOU usage breakdown
// - Peak shaving savings: $875/year
// - Battery optimization
// - Zero-export incentives: $5,650
```

## Follow-Up Strategy

### High-Priority Leads (Captured at Step 4)
- **Has consumption data** ✓
- Can calculate exact savings
- Can size battery optimally
- Can present personalized ROI

### Follow-Up Email Content
```
Subject: Your Solar Estimate is Almost Ready!

Hi John,

Based on your home's energy usage of 10,000 kWh/year 
($180/month), we've calculated some exciting numbers:

🔋 Recommended: 8.5 kW solar + 16 kWh battery
💰 Peak shaving savings: $875/year
🎁 Zero-export incentives: $5,650
📊 Payback period: 22 years

Click here to complete your estimate and see your 
detailed savings breakdown by time-of-use period.
```

## Database Storage

### Partial Leads Table
```sql
CREATE TABLE partial_leads (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  estimator_data JSONB NOT NULL,  -- Contains all fields above
  current_step INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Query Example
```sql
-- Find high-consumption leads (good for battery systems)
SELECT 
  email,
  address,
  estimator_data->>'monthlyBill' as monthly_bill,
  (estimator_data->'energyUsage'->>'annualKwh')::int as annual_kwh
FROM partial_leads
WHERE (estimator_data->'energyUsage'->>'annualKwh')::int > 8000
  AND current_step >= 4
ORDER BY created_at DESC;
```

## Completion Rate Tracking

By capturing at Step 4, you can track:
- **Step 4 → Review**: Saw their results
- **Step 4 → Abandoned**: Need follow-up
- **Review → Submitted**: Converted to lead

```sql
-- Conversion funnel
SELECT 
  current_step,
  COUNT(*) as count,
  AVG((estimator_data->'energyUsage'->>'annualKwh')::numeric) as avg_consumption
FROM partial_leads
GROUP BY current_step
ORDER BY current_step;
```

## Benefits

1. **Better Lead Quality**
   - Consumption data enables accurate quotes
   - Can prioritize high-usage leads
   - Enables personalized follow-up

2. **Peak Shaving Ready**
   - All data needed for TOU analysis
   - Battery recommendations possible
   - Zero-export incentive calculations ready

3. **Higher Conversion**
   - Personalized follow-up emails
   - Show actual savings numbers
   - Less guesswork = more trust

4. **Sales Intelligence**
   - Identify battery-ready homes
   - Target high-consumption properties
   - Optimize marketing spend

## Summary: Optimized Step Order - Consumption Data First

### ✅ Easy Mode (Step 3 - Energy)
- **Captures:** monthlyBill, homeSize, specialAppliances, energyUsage
- **Step flow:** Mode → Location → Roof → **[ENERGY + EMAIL]** → Add-ons → Photos → Details → Review → Submit

### ✅ Detailed Mode (Step 3 - Details)
- **Captures:** monthlyBill, roofType, roofAge, roofPitch, shadingLevel
- **Step flow:** Mode → Location → Draw Roof → **[DETAILS + EMAIL]** → Add-ons → Photos → Review → Submit

### Why This Order?
1. **Consumption data captured BEFORE photos** - prioritizes business-critical data
2. **Photos moved to Step 5** - nice-to-have, but not required for quote
3. **Add-ons at Step 4** - after consumption, before photos
4. **Higher completion rate** - users more willing to provide bill amount than upload photos

### Result
🎯 **100% of partial leads now include consumption data** needed for:
- Peak shaving calculations
- Battery sizing recommendations  
- Zero-export incentive eligibility
- Accurate ROI projections
- Personalized follow-up with real savings numbers

