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
}: SavingsTabProps) {
  // Net Metering-only savings view (TOU, ULO, Tiered)
  if (programType === 'net_metering' && netMetering) {
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
      const projection = planData?.projection
      const annualSavings =
        projection?.annualSavings ??
        (planData?.annual
          ? planData.annual.importCost - planData.annual.netAnnualBill
          : 0)

      return {
        id: plan.id,
        label: plan.label,
        annualSavings,
        paybackYears: projection?.paybackYears as number | null | undefined,
        profit25: projection?.netProfit25Year ?? 0,
      }
    })

    // Build multi-year profit series for the chart
    const savingsSeries = Array.from({ length: years }, (_, idx) => {
      const year = idx + 1

      const accumulate = (annual: number | undefined | null) => {
        if (!annual || annual <= 0) return { profit: 0 }
        let cumulative = 0
        for (let y = 1; y <= year; y++) {
          const yearSavings = annual * Math.pow(1 + escalation, y - 1)
          cumulative += yearSavings
        }
        return { profit: cumulative - netCost }
      }

      const tou = accumulate(planMetrics.find(p => p.id === 'tou')?.annualSavings)
      const ulo = accumulate(planMetrics.find(p => p.id === 'ulo')?.annualSavings)
      const tiered = accumulate(planMetrics.find(p => p.id === 'tiered')?.annualSavings)

      return {
        year,
        touProfit: tou.profit,
        uloProfit: ulo.profit,
        tieredProfit: tiered.profit,
      }
    })

    const allValues = savingsSeries.flatMap(d => [d.touProfit, d.uloProfit, d.tieredProfit])
    const maxValue = Math.max(...allValues, netCost)
    const minValue = Math.min(...allValues, -netCost)
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
                  {plan.paybackYears == null || plan.paybackYears === Infinity
                    ? 'N/A'
                    : `${plan.paybackYears.toFixed(1)} yrs`}
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
                <Line
                  type="monotone"
                  dataKey="tieredProfit"
                  stroke="#f59e0b"
                  strokeWidth={isMobile ? 3 : 3.5}
                  dot={{ r: isMobile ? 4 : 5, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: isMobile ? 7 : 8, fill: '#f59e0b', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                  name="25-Year Profit (Tiered)"
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                <ReferenceLine
                  y={netCost}
                  stroke="#16a34a"
                  strokeDasharray="4 4"
                  label={{
                    value: `Net Investment ${formatCurrency(netCost)}`,
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

    // Calculate Y-axis domain to zoom out and center the chart
    const allValues = savingsSeries.flatMap(d => [d.touCumulative, d.uloCumulative, d.touProfit, d.uloProfit])
    const maxValue = Math.max(...allValues, Math.max(touCombinedNet, uloCombinedNet))
    const minValue = Math.min(...allValues, -Math.max(touCombinedNet, uloCombinedNet))
    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15 // 15% padding
    const yDomain = [Math.floor((minValue - padding) / 10000) * 10000, Math.ceil((maxValue + padding) / 10000) * 10000]

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
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears === Infinity ? 'N/A' : `${paybackTouYears.toFixed(1)} yrs`}</div>
            <div className="mt-1 text-[13px] text-gray-600">ULO</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears === Infinity ? 'N/A' : `${paybackUloYears.toFixed(1)} yrs`}</div>
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
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                <ReferenceLine y={Math.max(touCombinedNet, uloCombinedNet)} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(Math.max(touCombinedNet, uloCombinedNet))}`, position: 'left', fill: '#166534', fontSize: 11 }} />
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

  // Calculate Y-axis domain to zoom out and center the chart
  const allValues = savingsSeries.flatMap(d => [d.touCumulative, d.uloCumulative, d.touProfit, d.uloProfit])
  const maxValue = Math.max(...allValues, combinedNetCost)
  const minValue = Math.min(...allValues, -combinedNetCost)
  const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.15 // 15% padding
  const yDomain = [Math.floor((minValue - padding) / 10000) * 10000, Math.ceil((maxValue + padding) / 10000) * 10000]

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
          <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears === Infinity ? 'N/A' : `${paybackTouYears.toFixed(1)} yrs`}</div>
          <div className="mt-1 text-[13px] text-gray-600">ULO</div>
          <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears === Infinity ? 'N/A' : `${paybackUloYears.toFixed(1)} yrs`}</div>
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
              <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              <ReferenceLine y={combinedNetCost} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(combinedNetCost)}`, position: 'left', fill: '#166534', fontSize: 11 }} />
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

