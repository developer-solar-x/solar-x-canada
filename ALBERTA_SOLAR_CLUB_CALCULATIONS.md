# Alberta Solar Club Calculator - Calculation Formulas and Explanations

## Overview

The Alberta Solar Club calculator processes solar production and energy usage hour-by-hour throughout the year (8,760 hours) to determine exports, imports, credits, and costs. The system uses seasonal rates: 33.00¢/kWh for exports during high production months (April-September) and 6.89¢/kWh for imports during low production months (October-March).

---

## Core Metrics and Formulas

### 1. Export Credits (Total Export Credits)

Export credits are earned when your solar system produces more electricity than you consume, and the excess is sent to the grid.

**Formula:**
```
Export Credits = (Exported kWh × Export Rate)
```

**Seasonal Rates:**
- **High Production Season (Apr-Sep):** 33.00¢/kWh for exports
- **Low Production Season (Oct-Mar):** 6.89¢/kWh for exports

**Calculation:**
```
Total Export Credits = High Season Export Credits + Low Season Export Credits

Where:
  High Season Export Credits = Exported kWh (Apr-Sep) × 0.33
  Low Season Export Credits = Exported kWh (Oct-Mar) × 0.0689
```

**Example:** If you export 4,623 kWh during high production season:
- High Season Credits = 4,623 × $0.33 = $1,526

**What it means:** This is the total dollar value of credits you've earned by exporting excess solar energy. These credits can be used to offset future bills or expire after 12 months if unused.

---

### 2. Import Cost

Import cost is the amount you pay for electricity purchased from the grid when your solar system doesn't produce enough to meet your needs.

**Formula:**
```
Import Cost = Imported kWh × 6.89¢/kWh
```

**Important:** Alberta Solar Club always uses the low import rate (6.89¢/kWh) regardless of the season.

**Calculation Process:**
For each hour of the year:
1. Compare solar production vs. energy usage
2. If usage > production, the difference is imported from the grid
3. Multiply imported kWh by 6.89¢/kWh
4. Sum all hourly import costs

**Example:** If you import 3,820 kWh during low production season:
- Import Cost = 3,820 × $0.0689 = $263

**What it means:** This is what you would pay for grid electricity if you didn't have solar credits to offset it.

---

### 3. Net Annual Bill

Net annual bill is your final electricity bill after applying all export credits and accounting for credit rollover throughout the year.

**Formula:**
```
Net Annual Bill = Total Import Cost - Total Export Credits - Cash Back
```

However, the actual calculation is more complex because it accounts for monthly credit rollover using a FIFO (First In, First Out) system:

**Step-by-Step Process:**

1. **For each month:**
   - Calculate monthly export credits and import costs
   - Determine monthly net position (credits earned - costs)
   
2. **If monthly net position is negative (you owe money):**
   - Apply oldest banked credits first (FIFO)
   - Remaining balance = monthly bill
   
3. **If monthly net position is positive (you have surplus):**
   - Add surplus to credit queue with month timestamp
   
4. **Sum all monthly bills after rollover:**
   ```
   Total Net Bill = Sum of all monthly bills (after credits applied)
   ```
   
5. **Final calculation:**
   ```
   Net Annual Bill = Total Net Bill - Year-End Credits
   ```

**Result Interpretation:**
- **Negative value** (e.g., -$1,145): You have a credit balance; the utility owes you money
- **Positive value**: This is the amount you owe after all credits are applied
- **Zero or near zero**: Your credits perfectly offset your costs

**What it means:** This is your actual annual electricity bill after all solar credits and rollovers are applied. It's the bottom line of what you pay (or are owed).

---

### 4. Banked Credits / Year-End Credits

Banked credits are export credits you've earned but haven't used yet. They carry forward month-to-month but expire after 12 months.

**Formula:**
```
Year-End Credits = Sum of all unused credits remaining in credit queue at year-end
```

**Credit Banking Process:**

1. **Credit Generation:** When you export more than you import in a month, surplus credits are added to the queue with a timestamp

2. **Credit Application:** When you owe money in a month, oldest credits (FIFO) are applied first

3. **Credit Expiration:** Credits older than 12 months are automatically removed

4. **Year-End Balance:** Remaining credits after all applications and expirations

**Example:** If you end the year with $1,280 in banked credits, these are credits that:
- Were earned during the year but not used
- Are still valid (not expired)
- Will expire if not used within 12 months of when they were earned

**What it means:** These credits are available for next year, but watch out—if you consistently end with high year-end credits, you might be losing value through expiration.

---

### 5. Annual Savings

Annual savings represents how much money you save compared to not having solar.

**Formula:**
```
Annual Savings = Pre-Solar Annual Bill - Net Annual Bill
```

**Pre-Solar Bill Calculation:**
The calculator uses whichever is available:
```
Pre-Solar Bill = Monthly Bill × 12
```
OR
```
Pre-Solar Bill = Annual Usage (kWh) × 6.89¢/kWh
```

**Example:**
- Pre-solar annual bill: $2,000
- Net annual bill: -$1,145 (credit balance)
- Annual Savings = $2,000 - (-$1,145) = $3,145

**What it means:** This is the total financial benefit of having solar. If you have a negative net bill (credit balance), your savings exceed your original bill amount.

---

### 6. Bill Offset

Bill offset shows what percentage of your import costs are offset by export credits. It can exceed 100% if your credits exceed your costs.

**Formula:**
```
Bill Offset % = (Total Import Cost - Net Annual Bill) / Total Import Cost × 100
```

Or simplified:
```
Bill Offset % = (Total Export Credits / Total Import Cost) × 100
```

**Example:**
- Total Export Credits: $1,573
- Total Import Cost: $405
- Bill Offset = ($1,573 / $405) × 100 = 388.0%

**Interpretation:**
- **100%**: Credits exactly offset all costs
- **>100%** (e.g., 388%): Credits far exceed costs, leaving you with a credit balance
- **<100%**: Credits offset part of your costs, but you still owe money

**What it means:** This metric shows how effective your solar system is at offsetting your electricity costs. A high percentage (over 100%) indicates your system is producing more value than you consume.

---

### 7. Energy Coverage

Energy coverage shows what percentage of your annual energy usage is produced by your solar system.

**Formula:**
```
Energy Coverage % = (Total Solar Production / Total Load) × 100
```

**Example:**
- Total Solar Production: 9,888 kWh
- Total Load (Usage): 10,782 kWh
- Energy Coverage = (9,888 / 10,782) × 100 = 91.8%

**Interpretation:**
- **100%**: Solar production equals your usage (perfect sizing)
- **>100%**: Solar produces more than you use (oversized system)
- **<100%**: Solar produces less than you use (undersized system)

**Important Note:** Energy coverage doesn't mean you consume all the solar you produce directly. Much of it is exported and banked as credits.

**What it means:** This metric helps you understand if your system is appropriately sized for your energy needs. With Alberta Solar Club's high export rates, systems over 100% coverage can still be profitable due to the 33¢/kWh export rate.

---

### 8. Total Export Credits

This is the sum of all export credits earned throughout the year, broken down by season.

**Formula:**
```
Total Export Credits = High Season Export Credits + Low Season Export Credits
```

**Seasonal Breakdown:**
- **High Production Season (Apr-Sep):** Exports at 33.00¢/kWh
- **Low Production Season (Oct-Mar):** Exports at 6.89¢/kWh

**What it means:** This is the total value of credits you've earned. With Alberta Solar Club's seasonal rate structure, most of your credits come from high production months when you export at the premium 33¢/kWh rate.

---

### 9. Payback Period

Payback period shows how many years it takes for your solar savings to equal your initial system investment.

**Formula:**
```
Payback Period (years) = Total System Cost / Annual Savings
```

**Example:**
- System Cost: $26,100
- Annual Savings: $1,573
- Payback Period = $26,100 / $1,573 = 16.6 years

**Interpretation:**
- **<10 years:** Excellent return on investment
- **10-15 years:** Good investment
- **15-20 years:** Moderate investment (still profitable over 25+ years)
- **>20 years:** Long-term investment, consider if other factors (environmental, property value) matter to you

**What it means:** This tells you how long until your solar system "pays for itself." After the payback period, all savings are pure profit for the remaining system life (typically 25+ years).

---

## Additional Metrics

### Cash Back

Alberta Solar Club offers 3% cash back on all imported electricity.

**Formula:**
```
Cash Back = Total Import Cost × 0.03
```

**What it means:** An additional benefit on top of export credits. You get 3% back on electricity you purchase from the grid.

---

### Carbon Credits

Estimated annual value of carbon offset credits.

**Formula:**
```
Estimated Carbon Credits = Max($50, Min($200, Total Solar Production × 0.01))
```

This is a simplified estimate. Actual carbon credit value varies based on market rates and certification programs.

**What it means:** Potential additional income from carbon offset programs, typically ranging from $50-$200 per year depending on system size.

---

## Monthly Credit Rollover System

The calculator uses a sophisticated credit banking system that models Alberta Solar Club's actual rules:

### How It Works:

1. **Month with Surplus:**
   - Export Credits > Import Cost
   - Surplus = Export Credits - Import Cost
   - Surplus is added to credit queue with month timestamp
   - Monthly Bill = $0

2. **Month with Deficit:**
   - Import Cost > Export Credits
   - Deficit = Import Cost - Export Credits
   - Apply oldest credits from queue (FIFO)
   - Monthly Bill = Remaining deficit after credits applied

3. **Credit Expiration:**
   - Credits expire 12 months after they were earned
   - Expired credits are automatically removed from queue
   - Example: Credits earned in April 2024 expire in March 2025

4. **Year-End Balance:**
   - All credits remaining in queue at year-end
   - These credits carry forward but still expire 12 months after earning

### Example Timeline:

- **April:** Export $500, Import $100 → Bank $400 in credits
- **May:** Export $450, Import $120 → Bank $330 in credits (total: $730)
- **October:** Export $50, Import $300 → Apply $250 from oldest credits, bill $50
- **November:** Export $30, Import $350 → Apply remaining $480 from credits, bill $0 (with $160 left over)
- **December:** Export $20, Import $400 → Apply $160 credits, bill $240

---

## Key Insights for Alberta Solar Club

### Why These Calculations Matter:

1. **Seasonal Rate Advantage:** The 33¢/kWh export rate during high production months (Apr-Sep) is significantly higher than the 6.89¢/kWh import rate, making it profitable to oversize your system.

2. **Credit Banking Strategy:** You can "bank" credits during summer to use in winter, but be careful—credits expire after 12 months. Ending the year with high credits might indicate you're losing value through expiration.

3. **System Sizing:** With the premium export rate, systems that produce more than 100% of your usage can still be highly profitable, unlike traditional net metering programs.

4. **Rate Switching Required:** These calculations assume you switch rates seasonally:
   - Switch to 33¢/kWh export rate in April
   - Switch to 6.89¢/kWh import rate in October
   - Forgetting to switch can reduce savings by $300-$800 per year

### Optimizing Your Results:

- **Undersized System (<90% coverage):** Consider upsizing to capture more export credits during high production months
- **High Year-End Credits:** Indicates credits may be expiring—consider if system is oversized or usage patterns could be adjusted
- **Long Payback Period (>15 years):** May still be profitable over 25 years, but consider if initial investment aligns with your goals

---

## Summary

The Alberta Solar Club calculator processes your solar production and energy usage hour-by-hour, applies seasonal rates (33¢/kWh exports in summer, 6.89¢/kWh imports in winter), and models credit banking with 12-month expiration. The result is a comprehensive financial picture showing:

- How much you'll save annually
- When you'll break even on your investment
- How effectively your system offsets costs
- Whether your system size is optimal

All calculations account for real-world factors like seasonal production variations, credit rollover, expiration, and the unique Alberta Solar Club rate structure that rewards export during high production months.

