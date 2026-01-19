'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { SavingsTooltip } from '../SavingsTooltip'

interface SavingsTabProps {
  estimate: any
  programType?: string
  netMetering?: {
    tou?: any
    ulo?: any
    tiered?: any
  }
  includeBattery: boolean
  tou?: any
  ulo?: any
  peakShaving?: any
  combinedNetCost: number
  isMobile: boolean
  annualEscalator?: number // Annual rate increase from Step 3
  touBeforeAfter?: { before: number; after: number; savings: number } | null
  uloBeforeAfter?: { before: number; after: number; savings: number } | null
  province?: string
}

export function SavingsTab({
  estimate,
  programType,
  netMetering,
  includeBattery,
  tou,
  ulo,
  peakShaving,
  combinedNetCost,
  isMobile,
  annualEscalator = 4.5, // Default to 4.5% if not provided
  touBeforeAfter,
  uloBeforeAfter,
  province,
}: SavingsTabProps) {
  // Check if province is Alberta - check multiple sources
  const provinceFromProp = province
  const provinceUpper = provinceFromProp ? provinceFromProp.toUpperCase() : ''
  const isAlbertaFromProp = provinceUpper === 'AB' || provinceUpper === 'ALBERTA' || provinceUpper.includes('ALBERTA')
  
  // Also check localStorage for province (fallback)
  let isAlberta = isAlbertaFromProp
  if (typeof window !== 'undefined' && !isAlberta) {
    try {
      const savedData = localStorage.getItem('solarx_estimator_draft')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const savedProvince = parsed?.data?.province || parsed?.data?.location?.province
        if (savedProvince) {
          const savedProvinceUpper = savedProvince.toUpperCase()
          isAlberta = savedProvinceUpper === 'AB' || savedProvinceUpper === 'ALBERTA' || savedProvinceUpper.includes('ALBERTA')
          console.log('[SavingsTab] Found province in localStorage:', savedProvince, 'isAlberta:', isAlberta)
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  // Check if netMetering has alberta property (for Alberta Solar Club)
  // Check multiple possible structures:
  // 1. netMetering.alberta (direct)
  // 2. netMetering.tou.alberta (Alberta stored in tou property)
  // 3. netMetering.data.alberta (wrapped in data)
  // 4. netMetering.ratePlan.id === 'alberta_solar_club'
  const hasAlbertaData = netMetering && (
    (netMetering as any).alberta !== undefined ||
    (netMetering as any).tou?.alberta !== undefined ||
    (netMetering as any).data?.alberta !== undefined ||
    (netMetering as any).ratePlan?.id === 'alberta_solar_club' ||
    (netMetering as any).tou?.ratePlan?.id === 'alberta_solar_club'
  )
  
  // Debug logging
  if (programType === 'net_metering') {
    console.log('[SavingsTab] Net Metering Debug:', {
      provinceFromProp,
      isAlbertaFromProp,
      isAlberta,
      hasAlbertaData,
      netMeteringKeys: netMetering ? Object.keys(netMetering as any) : null,
      netMeteringHasAlberta: netMetering ? (netMetering as any).alberta !== undefined : false,
      netMeteringTouHasAlberta: netMetering ? (netMetering as any).tou?.alberta !== undefined : false,
      netMeteringStructure: netMetering ? JSON.stringify(netMetering).substring(0, 500) : null,
    })
  }
  
  // Net Metering-only savings view (TOU, ULO, Tiered)
  // For Alberta, they use Alberta Solar Club, not TOU/ULO/Tiered, so don't show this section
  // Also show for 'quick' program type if net metering data exists (quick estimate can include net metering step)
  if ((programType === 'net_metering' || programType === 'quick') && netMetering && !isAlberta && !hasAlbertaData) {
    const escalation = (annualEscalator ?? 4.5) / 100
    const years = 25
    const netCost = combinedNetCost || 0

    const plans = [
      { id: 'tou', label: 'TOU' },
      { id: 'ulo', label: 'ULO' },
      { id: 'tiered', label: 'Tiered' },
    ] as const

    const planMetrics = plans.map(plan => {
      const planData = (netMetering as any)[plan.id]
      if (!planData) {
        console.warn(`[SavingsTab] Missing plan data for ${plan.id}:`, netMetering)
        // Return null for missing plans so they can be filtered out
        return null
      }
      const projection = planData?.projection
      const annualSavings =
        projection?.annualSavings ??
        (planData?.annual
          ? planData.annual.importCost - planData.annual.netAnnualBill
          : 0)

      // Recalculate 25-year profit to ensure it matches the chart calculation
      // Use the same netCost and escalation as the chart
      const profit25 = annualSavings > 0 && netCost > 0
        ? calculateSimpleMultiYear({ annualSavings } as any, netCost, escalation, 25).netProfit25Year
        : (projection?.netProfit25Year ?? 0)

      return {
        id: plan.id,
        label: plan.label,
        annualSavings,
        paybackYears: projection?.paybackYears as number | null | undefined,
        profit25,
      }
    }).filter((plan): plan is NonNullable<typeof plan> => plan !== null)

    // Build multi-year profit series for the chart
    const savingsSeries = Array.from({ length: years }, (_, idx) => {
      const year = idx + 1

      const accumulate = (annual: number | undefined | null) => {
        if (annual === null || annual === undefined) return { profit: -netCost }
        let cumulative = 0
        for (let y = 1; y <= year; y++) {
          const yearSavings = annual * Math.pow(1 + escalation, y - 1)
          cumulative += yearSavings
        }
        return { profit: cumulative - netCost }
      }

      const tou = accumulate(planMetrics.find(p => p.id === 'tou')?.annualSavings)
      const ulo = accumulate(planMetrics.find(p => p.id === 'ulo')?.annualSavings)
      const tieredPlan = planMetrics.find(p => p.id === 'tiered')
      const tiered = tieredPlan ? accumulate(tieredPlan.annualSavings) : null

      return {
        year,
        touProfit: tou.profit,
        uloProfit: ulo.profit,
        tieredProfit: tiered?.profit ?? null, // Use null instead of -netCost when tiered data doesn't exist
      }
    })

    // Y-axis domain for profit view (0 = break-even). Include 0 and -netCost explicitly so the full range is visible.
    // Filter out null values for tieredProfit
    const allValues = savingsSeries.flatMap(d => [d.touProfit, d.uloProfit, d.tieredProfit, 0, -netCost]).filter(v => v !== null) as number[]
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15
    const yDomain = [
      Math.floor((minValue - padding) / 10000) * 10000,
      Math.ceil((maxValue + padding) / 10000) * 10000,
    ]

    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Annual Savings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">Annual Savings (Year 1)</div>
            {planMetrics.map(plan => (
              <div key={plan.id} className="mt-1">
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {formatCurrency(Math.round(plan.annualSavings || 0))}
                </div>
              </div>
            ))}
          </div>

          {/* Payback Period */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">Payback</div>
            {planMetrics.map(plan => (
              <div key={plan.id} className="mt-1">
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {plan.paybackYears != null && isFinite(plan.paybackYears)
                    ? `${plan.paybackYears.toFixed(1)} yrs`
                    : 'N/A'}
                </div>
              </div>
            ))}
          </div>

          {/* 25-Year Profit */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-2">25-Year Profit</div>
            {planMetrics.map(plan => (
              <div key={plan.id} className="mt-1">
                <div className="text-[13px] text-gray-600">{plan.label}</div>
                <div className="text-base sm:text-xl font-bold text-navy-600">
                  {formatCurrency(Math.round(plan.profit25 || 0))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[28rem] w-full overflow-x-visible overflow-y-visible relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={savingsSeries}
                margin={
                  isMobile
                    ? { top: 20, right: 30, left: 40, bottom: 40 }
                    : { top: 20, right: 80, left: 60, bottom: 60 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  label={{
                    value: 'Year',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 12 },
                  }}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip
                  content={<SavingsTooltip />}
                  allowEscapeViewBox={{ x: true, y: true }}
                  cursor={{ stroke: '#1B4E7C', strokeWidth: 2, strokeDasharray: '4 4' }}
                  wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="touProfit"
                  stroke="#1B4E7C"
                  strokeWidth={isMobile ? 3 : 3.5}
                  dot={{ r: isMobile ? 4 : 5, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (TOU)"
                />
                <Line
                  type="monotone"
                  dataKey="uloProfit"
                  stroke="#DC143C"
                  strokeWidth={isMobile ? 3 : 3.5}
                  dot={{ r: isMobile ? 4 : 5, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (ULO)"
                />
                {planMetrics.find(p => p.id === 'tiered') && (
                  <Line
                    type="monotone"
                    dataKey="tieredProfit"
                    stroke="#f59e0b"
                    strokeWidth={isMobile ? 3 : 3.5}
                    dot={{ r: isMobile ? 4 : 5, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: isMobile ? 7 : 8, fill: '#f59e0b', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                    name="25-Year Profit (Tiered)"
                  />
                )}
                {/* 0 on the profit axis is the break-even point (system has repaid net investment) */}
                <ReferenceLine
                  y={0}
                  stroke="#16a34a"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Break-even (recovers net investment)',
                    position: 'left',
                    fill: '#166534',
                    fontSize: 11,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          Net metering projections are based on your system cost, first-year net metering savings for each
          rate plan, and the electricity rate escalation over 25 years. Tiered reflects a flat-rate
          net metering option where available.
        </p>
      </div>
    )
  }

  const solarAnnual = estimate.savings?.annualSavings || 0
  const escalation = (annualEscalator ?? 4.5) / 100 // Convert percentage to decimal
  const years = 25

  // For Alberta, use Solar Club savings from netMetering instead of TOU/ULO
  // Check both isAlberta flag and if netMetering has alberta property
  // Handle multiple possible structures:
  // 1. netMetering.tou.alberta (most common - Alberta stored in tou property)
  // 2. netMetering.alberta (direct)
  // 3. netMetering.data.alberta (wrapped in data)
  const albertaNetMetering = (netMetering as any)?.tou?.alberta ? (netMetering as any).tou :
                              (netMetering as any)?.alberta ? (netMetering as any) :
                              (netMetering as any)?.data?.alberta ? (netMetering as any).data :
                              null
  
  if ((isAlberta || hasAlbertaData) && albertaNetMetering && albertaNetMetering.alberta) {
    const albertaData = albertaNetMetering
    const annual = albertaData.annual || {}
    const alberta = albertaData.alberta || {}
    
    // Calculate annual savings: importCost (before) - netAnnualBill (after) + cash back
    const importCost = annual.importCost || 0
    const netAnnualBill = annual.netAnnualBill || 0
    const cashBack = alberta.cashBackAmount || 0
    const solarClubAnnualSavings = Math.max(0, importCost - netAnnualBill + cashBack)
    
    const netCost = combinedNetCost || 0
    
    // Calculate payback
    const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
      if (netCost <= 0 || firstYearSavings <= 0) return 0
      let cumulativeSavings = 0
      for (let year = 1; year <= 25; year++) {
        const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
        cumulativeSavings += yearSavings
        if (cumulativeSavings >= netCost) {
          const prevYearSavings = year > 1 ? firstYearSavings * Math.pow(1 + escalationRate, year - 2) : 0
          const prevCumulative = cumulativeSavings - yearSavings
          const remaining = netCost - prevCumulative
          const fraction = remaining / yearSavings
          return (year - 1) + fraction
        }
      }
      return Infinity
    }
    
    const paybackYears = calculatePayback(solarClubAnnualSavings, netCost, escalation)
    
    // Build cumulative savings series
    const series = Array.from({ length: years }, (_, idx) => {
      const y = idx + 1
      const yearSavings = solarClubAnnualSavings * Math.pow(1 + escalation, idx)
      return { year: y, annualSavings: yearSavings }
    })
    
    let cumulative = 0
    const savingsSeries = series.map(row => {
      cumulative += row.annualSavings
      return {
        year: row.year,
        cumulativeSavings: cumulative,
        profit: cumulative - netCost
      }
    })
    
    const paybackYear = paybackYears !== Infinity && paybackYears <= 25 ? Math.ceil(paybackYears) : null
    const year25Data = savingsSeries.find(d => d.year === 25)
    
    // Calculate Y-axis domain - include -netCost to ensure initial investment is visible
    const allValues = savingsSeries.flatMap(d => [d.cumulativeSavings, d.profit, 0, -netCost])
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15
    const yDomain = [
      Math.floor((minValue - padding) / 10000) * 10000,
      Math.ceil((maxValue + padding) / 10000) * 10000,
    ]
    
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Annual Savings (Year 1)</div>
            <div className="text-[13px] text-gray-600">Solar Club</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(solarClubAnnualSavings))}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Payback</div>
            <div className="text-[13px] text-gray-600">Solar Club</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackYears != null && isFinite(paybackYears) ? `${paybackYears.toFixed(1)} yrs` : 'N/A'}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
            <div className="text-[13px] text-gray-600">Solar Club</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{year25Data ? formatCurrency(Math.round(year25Data.profit)) : 'N/A'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[28rem] w-full overflow-x-visible overflow-y-visible relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsSeries} margin={isMobile ? { top: 20, right: 30, left: 40, bottom: 40 } : { top: 20, right: 80, left: 60, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                />
                <YAxis 
                  domain={yDomain}
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip 
                  content={<SavingsTooltip />} 
                  allowEscapeViewBox={{ x: true, y: true }} 
                  cursor={{ stroke: '#DC143C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                  wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
                />
                <Line
                  type="monotone" 
                  dataKey="cumulativeSavings" 
                  stroke="#DC143C" 
                  strokeWidth={isMobile ? 2 : 2.5} 
                  strokeDasharray="5 5" 
                  dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="Cumulative Savings (Solar Club)" 
                />
                <Line
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#DC143C" 
                  strokeWidth={isMobile ? 3 : 3.5} 
                  dot={{ r: isMobile ? 4 : 5, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (Solar Club)" 
                />
                <ReferenceLine
                  y={0}
                  stroke="#16a34a"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Break-even (recovers net investment)',
                    position: 'left',
                    fill: '#166534',
                    fontSize: 11,
                  }}
                />
                {paybackYear && paybackYear <= 25 && (
                  <ReferenceLine 
                    x={paybackYear} 
                    stroke="#DC143C" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{ value: `Solar Club: ${paybackYears.toFixed(1)} yrs`, position: 'top', fill: '#DC143C', fontSize: 11, fontWeight: 'bold', offset: 5 }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
                <span className="text-gray-700">Cumulative Savings (Solar Club)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#DC143C]"></div>
                <span className="text-gray-700">25-Year Profit (Solar Club)</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-600">
          Alberta Solar Club projections are based on your system cost, first-year Solar Club savings, 
          and the electricity rate escalation over 25 years. Savings include export credits at 33¢/kWh 
          during high production months and 3% cash back on imports.
        </p>
      </div>
    )
  }

  // Use beforeAfter values from step 4 if available (most accurate - matches step 4 display)
  // Calculate annual savings as before - after (same as step 4)
  const touCombinedAnnual = touBeforeAfter && touBeforeAfter.before > 0 && touBeforeAfter.after >= 0
    ? touBeforeAfter.before - touBeforeAfter.after
    : (peakShaving as any)?.tou?.combined?.combinedAnnualSavings ?? 
      (peakShaving as any)?.tou?.combined?.annual ?? 
      ((tou?.result?.annualSavings || 0) + solarAnnual)
  
  const uloCombinedAnnual = uloBeforeAfter && uloBeforeAfter.before > 0 && uloBeforeAfter.after >= 0
    ? uloBeforeAfter.before - uloBeforeAfter.after
    : (peakShaving as any)?.ulo?.combined?.combinedAnnualSavings ?? 
      (peakShaving as any)?.ulo?.combined?.annual ?? 
      ((ulo?.result?.annualSavings || 0) + solarAnnual)

  const haveTouAndUlo = Boolean(includeBattery && (touBeforeAfter || tou?.result?.annualSavings != null) && (uloBeforeAfter || ulo?.result?.annualSavings != null))

  if (haveTouAndUlo) {
    const touCombinedNet = (peakShaving as any)?.tou?.combined?.netCost ?? combinedNetCost
    const uloCombinedNet = (peakShaving as any)?.ulo?.combined?.netCost ?? combinedNetCost

    // Build TOU and ULO cumulative series
    const series = Array.from({ length: years }, (_, idx) => {
      const y = idx + 1
      const touYear = touCombinedAnnual * Math.pow(1 + escalation, idx)
      const uloYear = uloCombinedAnnual * Math.pow(1 + escalation, idx)
      return { year: y, touAnnual: touYear, uloAnnual: uloYear }
    })
    // Accumulate cumulatives and calculate profit (cumulative - net investment)
    let cumTou = 0
    let cumUlo = 0
    const savingsSeries = series.map(row => {
      cumTou += row.touAnnual
      cumUlo += row.uloAnnual
      return { 
        year: row.year, 
        touCumulative: cumTou, 
        uloCumulative: cumUlo,
        touProfit: cumTou - touCombinedNet,
        uloProfit: cumUlo - uloCombinedNet
      }
    })

    // Calculate payback by accumulating savings year by year until cumulative >= net cost
    // This matches the step-by-step calculation in Step 4
    const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
      if (netCost <= 0 || firstYearSavings <= 0) return 0
      let cumulativeSavings = 0
      for (let year = 1; year <= 25; year++) {
        const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
        cumulativeSavings += yearSavings
        if (cumulativeSavings >= netCost) {
          // Interpolate to get fractional year
          const prevYearSavings = year > 1 ? firstYearSavings * Math.pow(1 + escalationRate, year - 2) : 0
          const prevCumulative = cumulativeSavings - yearSavings
          const remaining = netCost - prevCumulative
          const fraction = remaining / yearSavings
          return (year - 1) + fraction
        }
      }
      return Infinity
    }
    
    const paybackTouYears = calculatePayback(touCombinedAnnual, touCombinedNet, escalation)
    const paybackUloYears = calculatePayback(uloCombinedAnnual, uloCombinedNet, escalation)
    // 25-year profit using annual escalator from Step 3
    const touProfit25 = (peakShaving as any)?.tou?.combined?.projection?.netProfit25Year ??
      calculateSimpleMultiYear({ annualSavings: touCombinedAnnual } as any, touCombinedNet, escalation, 25).netProfit25Year
    const uloProfit25 = (peakShaving as any)?.ulo?.combined?.projection?.netProfit25Year ??
      calculateSimpleMultiYear({ annualSavings: uloCombinedAnnual } as any, uloCombinedNet, escalation, 25).netProfit25Year

    // Find payback years
    const paybackTouYear = paybackTouYears !== Infinity && paybackTouYears <= 25 ? Math.ceil(paybackTouYears) : null
    const paybackUloYear = paybackUloYears !== Infinity && paybackUloYears <= 25 ? Math.ceil(paybackUloYears) : null
    const year25Data = savingsSeries.find(d => d.year === 25)

    // Calculate Y-axis domain to zoom out and center the chart around profits.
    // We include 0 and -netCost explicitly so the break-even line and initial investment are always visible.
    // Note: touCombinedNet and uloCombinedNet are already defined above
    const allValues = savingsSeries.flatMap(d => [d.touCumulative, d.uloCumulative, d.touProfit, d.uloProfit, 0, -touCombinedNet, -uloCombinedNet])
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15 // 15% padding
    const yDomain = [
      Math.floor((minValue - padding) / 10000) * 10000,
      Math.ceil((maxValue + padding) / 10000) * 10000,
    ]

    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Annual Savings (Year 1)</div>
            <div className="text-[13px] text-gray-600">TOU</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(touCombinedAnnual))}</div>
            <div className="mt-1 text-[13px] text-gray-600">ULO</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(uloCombinedAnnual))}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Payback</div>
            <div className="text-[13px] text-gray-600">TOU</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears != null && isFinite(paybackTouYears) ? `${paybackTouYears.toFixed(1)} yrs` : 'N/A'}</div>
            <div className="mt-1 text-[13px] text-gray-600">ULO</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears != null && isFinite(paybackUloYears) ? `${paybackUloYears.toFixed(1)} yrs` : 'N/A'}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
            <div className="text-[13px] text-gray-600">TOU</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{year25Data ? formatCurrency(Math.round(year25Data.touProfit)) : 'N/A'}</div>
            <div className="mt-1 text-[13px] text-gray-600">ULO</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{year25Data ? formatCurrency(Math.round(year25Data.uloProfit)) : 'N/A'}</div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Chart container with responsive height and margins - centered */}
          <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[28rem] w-full overflow-x-visible overflow-y-visible relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsSeries} margin={isMobile ? { top: 20, right: 30, left: 40, bottom: 40 } : { top: 20, right: 80, left: 60, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                />
                <YAxis 
                  domain={yDomain}
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip 
                  content={<SavingsTooltip />} 
                  allowEscapeViewBox={{ x: true, y: true }} 
                  cursor={{ stroke: '#1B4E7C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                  wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="touCumulative" 
                  stroke="#1B4E7C" 
                  strokeWidth={isMobile ? 2 : 2.5} 
                  strokeDasharray="5 5" 
                  dot={{ r: isMobile ? 3 : 4, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 6 : 7, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="Cumulative Savings (TOU)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="uloCumulative" 
                  stroke="#DC143C" 
                  strokeWidth={isMobile ? 2 : 2.5} 
                  strokeDasharray="5 5" 
                  dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="Cumulative Savings (ULO)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="touProfit" 
                  stroke="#10b981" 
                  strokeWidth={isMobile ? 3 : 3.5} 
                  dot={{ r: isMobile ? 4 : 5, fill: '#10b981', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#10b981', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (TOU)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="uloProfit" 
                  stroke="#8b5cf6" 
                  strokeWidth={isMobile ? 3 : 3.5} 
                  dot={{ r: isMobile ? 4 : 5, fill: '#8b5cf6', strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#8b5cf6', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (ULO)" 
                />
                {/* 0 on the profit axis is the break-even point (system has repaid net investment) */}
                <ReferenceLine
                  y={0}
                  stroke="#16a34a"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Break-even (recovers net investment)',
                    position: 'left',
                    fill: '#166534',
                    fontSize: 11,
                  }}
                />
                {/* Payback period vertical lines */}
                {paybackTouYear && paybackTouYear <= 25 && (
                  <ReferenceLine 
                    x={paybackTouYear} 
                    stroke="#3b82f6" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{ value: `TOU: ${paybackTouYears.toFixed(1)} yrs`, position: 'top', fill: '#2563eb', fontSize: 11, fontWeight: 'bold', offset: 5 }} 
                  />
                )}
                {paybackUloYear && paybackUloYear <= 25 && (
                  <ReferenceLine 
                    x={paybackUloYear} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{ value: `ULO: ${paybackUloYears.toFixed(1)} yrs`, position: 'top', fill: '#dc2626', fontSize: 11, fontWeight: 'bold', offset: 5 }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend moved outside chart container for mobile */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#1B4E7C] border-dashed border border-[#1B4E7C]"></div>
                <span className="text-gray-700">Cumulative Savings (TOU)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
                <span className="text-gray-700">Cumulative Savings (ULO)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#10b981]"></div>
                <span className="text-gray-700">25-Year Profit (TOU)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#8b5cf6]"></div>
                <span className="text-gray-700">25-Year Profit (ULO)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: single plan - but show both TOU and ULO
  // Use beforeAfter values if available, otherwise fall back to peakShaving data
  // touCombinedAnnual and uloCombinedAnnual are already calculated above
  
  // Build TOU and ULO cumulative series
  const series = Array.from({ length: years }, (_, idx) => {
    const y = idx + 1
    const touYear = touCombinedAnnual * Math.pow(1 + escalation, idx)
    const uloYear = uloCombinedAnnual * Math.pow(1 + escalation, idx)
    return { year: y, touAnnual: touYear, uloAnnual: uloYear }
  })
  
  // Accumulate cumulatives and calculate profit
  let cumTou = 0
  let cumUlo = 0
  const savingsSeries = series.map(row => {
    cumTou += row.touAnnual
    cumUlo += row.uloAnnual
    return { 
      year: row.year, 
      touCumulative: cumTou, 
      uloCumulative: cumUlo,
      touProfit: cumTou - combinedNetCost,
      uloProfit: cumUlo - combinedNetCost
    }
  })
  
  // Calculate payback by accumulating savings year by year until cumulative >= net cost
  // This matches the step-by-step calculation in Step 4
  const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
    if (netCost <= 0 || firstYearSavings <= 0) return 0
    let cumulativeSavings = 0
    for (let year = 1; year <= 25; year++) {
      const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
      cumulativeSavings += yearSavings
      if (cumulativeSavings >= netCost) {
        // Interpolate to get fractional year
        const prevYearSavings = year > 1 ? firstYearSavings * Math.pow(1 + escalationRate, year - 2) : 0
        const prevCumulative = cumulativeSavings - yearSavings
        const remaining = netCost - prevCumulative
        const fraction = remaining / yearSavings
        return (year - 1) + fraction
      }
    }
    return Infinity
  }
  
  const paybackTouYears = calculatePayback(touCombinedAnnual, combinedNetCost, escalation)
  const paybackUloYears = calculatePayback(uloCombinedAnnual, combinedNetCost, escalation)
  
  // Calculate 25-year profits
  const touProfit25 = (peakShaving as any)?.tou?.combined?.projection?.netProfit25Year ??
    calculateSimpleMultiYear({ annualSavings: touCombinedAnnual } as any, combinedNetCost, escalation, 25).netProfit25Year
  const uloProfit25 = (peakShaving as any)?.ulo?.combined?.projection?.netProfit25Year ??
    calculateSimpleMultiYear({ annualSavings: uloCombinedAnnual } as any, combinedNetCost, escalation, 25).netProfit25Year

  // Find payback years
  const paybackTouYear = paybackTouYears !== Infinity && paybackTouYears <= 25 ? Math.ceil(paybackTouYears) : null
  const paybackUloYear = paybackUloYears !== Infinity && paybackUloYears <= 25 ? Math.ceil(paybackUloYears) : null
  const year25Data = savingsSeries.find(d => d.year === 25)

  // Calculate Y-axis domain to zoom out and center the chart around profits.
  // We include 0 and -netCost explicitly so the break-even line and initial investment are always visible.
  const allValues = savingsSeries.flatMap(d => [d.touCumulative, d.uloCumulative, d.touProfit, d.uloProfit, 0, -combinedNetCost])
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15 // 15% padding
  const yDomain = [
    Math.floor((minValue - padding) / 10000) * 10000,
    Math.ceil((maxValue + padding) / 10000) * 10000,
  ]

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Annual Savings (Year 1)</div>
          <div className="text-[13px] text-gray-600">TOU</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(touCombinedAnnual))}</div>
          <div className="mt-1 text-[13px] text-gray-600">ULO</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(uloCombinedAnnual))}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Payback</div>
          <div className="text-[13px] text-gray-600">TOU</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears != null && isFinite(paybackTouYears) ? `${paybackTouYears.toFixed(1)} yrs` : 'N/A'}</div>
          <div className="mt-1 text-[13px] text-gray-600">ULO</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears != null && isFinite(paybackUloYears) ? `${paybackUloYears.toFixed(1)} yrs` : 'N/A'}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
          <div className="text-[13px] text-gray-600">TOU</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{year25Data ? formatCurrency(Math.round(year25Data.touProfit)) : 'N/A'}</div>
          <div className="mt-1 text-[13px] text-gray-600">ULO</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{year25Data ? formatCurrency(Math.round(year25Data.uloProfit)) : 'N/A'}</div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Chart container with responsive height and margins - centered */}
        <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[28rem] w-full overflow-x-visible overflow-y-visible relative z-10 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsSeries} margin={isMobile ? { top: 20, right: 30, left: 40, bottom: 40 } : { top: 20, right: 80, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              />
              <YAxis 
                domain={yDomain}
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                width={isMobile ? 45 : 60}
              />
              <Tooltip 
                content={<SavingsTooltip />} 
                allowEscapeViewBox={{ x: true, y: true }} 
                cursor={{ stroke: '#1B4E7C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
              />
              <Line
                type="monotone" 
                dataKey="touCumulative" 
                stroke="#1B4E7C" 
                strokeWidth={isMobile ? 2 : 2.5} 
                strokeDasharray="5 5" 
                dot={{ r: isMobile ? 3 : 4, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 6 : 7, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="Cumulative Savings (TOU)" 
              />
              <Line
                type="monotone" 
                dataKey="uloCumulative" 
                stroke="#DC143C" 
                strokeWidth={isMobile ? 2 : 2.5} 
                strokeDasharray="5 5" 
                dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="Cumulative Savings (ULO)" 
              />
              <Line
                type="monotone" 
                dataKey="touProfit" 
                stroke="#10b981" 
                strokeWidth={isMobile ? 3 : 3.5} 
                dot={{ r: isMobile ? 4 : 5, fill: '#10b981', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 7 : 8, fill: '#10b981', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="25-Year Profit (TOU)" 
              />
              <Line
                type="monotone" 
                dataKey="uloProfit" 
                stroke="#8b5cf6" 
                strokeWidth={isMobile ? 3 : 3.5} 
                dot={{ r: isMobile ? 4 : 5, fill: '#8b5cf6', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 7 : 8, fill: '#8b5cf6', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="25-Year Profit (ULO)" 
              />
              {/* 0 on the profit axis is the break-even point (system has repaid net investment) */}
              <ReferenceLine
                y={0}
                stroke="#16a34a"
                strokeDasharray="4 4"
                label={{
                  value: 'Break-even (recovers net investment)',
                  position: 'left',
                  fill: '#166534',
                  fontSize: 11,
                }}
              />
              {/* Payback period vertical lines */}
              {paybackTouYear && paybackTouYear <= 25 && (
                <ReferenceLine 
                  x={paybackTouYear} 
                  stroke="#3b82f6" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ value: `TOU: ${paybackTouYears.toFixed(1)} yrs`, position: 'top', fill: '#2563eb', fontSize: 11, fontWeight: 'bold', offset: 5 }} 
                />
              )}
              {paybackUloYear && paybackUloYear <= 25 && (
                <ReferenceLine 
                  x={paybackUloYear} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ value: `ULO: ${paybackUloYears.toFixed(1)} yrs`, position: 'top', fill: '#dc2626', fontSize: 11, fontWeight: 'bold', offset: 5 }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend moved outside chart container for mobile */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#1B4E7C] border-dashed border border-[#1B4E7C]"></div>
              <span className="text-gray-700">Cumulative Savings (TOU)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
              <span className="text-gray-700">Cumulative Savings (ULO)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#10b981]"></div>
              <span className="text-gray-700">25-Year Profit (TOU)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#8b5cf6]"></div>
              <span className="text-gray-700">25-Year Profit (ULO)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

