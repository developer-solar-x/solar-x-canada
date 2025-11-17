'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { SavingsTooltip } from '../SavingsTooltip'

interface SavingsTabProps {
  estimate: any
  includeBattery: boolean
  tou?: any
  ulo?: any
  peakShaving?: any
  combinedNetCost: number
  isMobile: boolean
}

export function SavingsTab({
  estimate,
  includeBattery,
  tou,
  ulo,
  peakShaving,
  combinedNetCost,
  isMobile,
}: SavingsTabProps) {
  const solarAnnual = estimate.savings?.annualSavings || 0
  const escalation = 0.05
  const years = 25

  const haveTouAndUlo = Boolean(includeBattery && tou?.result?.annualSavings != null && ulo?.result?.annualSavings != null)
  const touAnnual = (tou?.result?.annualSavings || 0) + solarAnnual
  const uloAnnual = (ulo?.result?.annualSavings || 0) + solarAnnual

  if (haveTouAndUlo) {
    // Prefer combined totals from peak-shaving results if available (keeps parity with Rate Plan Comparison)
    const touCombinedAnnual = (peakShaving as any)?.tou?.combined?.annual ?? touAnnual
    const uloCombinedAnnual = (peakShaving as any)?.ulo?.combined?.annual ?? uloAnnual
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

    // Payback to match Rate Plan Comparison (Net ÷ Annual)
    const paybackTouYears = touCombinedNet <= 0 ? 0 : (touCombinedAnnual > 0 ? touCombinedNet / touCombinedAnnual : Infinity)
    const paybackUloYears = uloCombinedNet <= 0 ? 0 : (uloCombinedAnnual > 0 ? uloCombinedNet / uloCombinedAnnual : Infinity)
    // 25-year profit to match Rate Plan Comparison
    const touProfit25 = (peakShaving as any)?.tou?.combined?.projection?.netProfit25Year ??
      calculateSimpleMultiYear({ annualSavings: touCombinedAnnual } as any, touCombinedNet, 0.05, 25).netProfit25Year
    const uloProfit25 = (peakShaving as any)?.ulo?.combined?.projection?.netProfit25Year ??
      calculateSimpleMultiYear({ annualSavings: uloCombinedAnnual } as any, uloCombinedNet, 0.05, 25).netProfit25Year

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
            <div className="text-xs text-gray-600 mb-1">Your Net Investment</div>
            <div className="text-xl font-bold text-navy-600">{formatCurrency(Math.max(touCombinedNet, uloCombinedNet))}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Estimated Payback</div>
            <div className="text-[13px] text-gray-600">TOU</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears === Infinity ? 'N/A' : `${paybackTouYears.toFixed(1)} yrs`}</div>
            <div className="mt-1 text-[13px] text-gray-600">ULO</div>
            <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears === Infinity ? 'N/A' : `${paybackUloYears.toFixed(1)} yrs`}</div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Chart container with responsive height and margins */}
          <div className="chart-scroll-container h-[22rem] sm:h-80 md:h-80 w-full overflow-x-visible overflow-y-visible relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsSeries} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 160, left: 48, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 11 }} 
                  tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                  label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  width={isMobile ? 38 : 50}
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
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                <ReferenceLine y={Math.max(touCombinedNet, uloCombinedNet)} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(Math.max(touCombinedNet, uloCombinedNet))}`, position: 'left', fill: '#166534', fontSize: 11 }} />
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
                <div className="w-4 h-1 bg-[#1B4E7C]"></div>
                <span className="text-gray-700">25-Year Profit (TOU)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#DC143C]"></div>
                <span className="text-gray-700">25-Year Profit (ULO)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">25-Year Profit (TOU)</div>
            <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(touProfit25))}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">25-Year Profit (ULO)</div>
            <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(uloProfit25))}</div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: single plan (selected/best)
  const planData: any = (tou || ulo)
  const planAnnual = planData?.result?.annualSavings || 0
  const combinedAnnual = solarAnnual + (includeBattery ? planAnnual : 0)
  const savingsSeries: { year: number; annual: number; cumulative: number; profit: number }[] = []
  let cumulative = 0
  for (let y = 1; y <= years; y++) {
    const annual = combinedAnnual * Math.pow(1 + escalation, y - 1)
    cumulative += annual
    savingsSeries.push({ year: y, annual, cumulative, profit: cumulative - combinedNetCost })
  }
  // Payback to match Rate Plan Comparison
  const paybackYears = combinedNetCost <= 0 ? 0 : (combinedAnnual > 0 ? combinedNetCost / combinedAnnual : Infinity)
  const profit25 = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNetCost, 0.05, 25).netProfit25Year

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Combined Annual Savings (Year 1)</div>
          <div className="text-xl font-bold text-navy-600">{formatCurrency(Math.round(combinedAnnual))}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Your Net Investment</div>
          <div className="text-xl font-bold text-navy-600">{formatCurrency(combinedNetCost)}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Estimated Payback</div>
          <div className="text-xl font-bold text-navy-600">{paybackYears === Infinity ? 'N/A' : `${paybackYears.toFixed(1)} yrs`}</div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Chart container with responsive height and margins */}
        <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[26rem] w-full overflow-x-visible overflow-y-visible relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsSeries} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 160, left: 48, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 11 }} 
                tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                width={isMobile ? 38 : 50}
              />
              <Tooltip 
                content={<SavingsTooltip />} 
                allowEscapeViewBox={{ x: true, y: true }} 
                cursor={{ stroke: '#DC143C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#DC143C" 
                strokeWidth={isMobile ? 2 : 2.5} 
                strokeDasharray="5 5" 
                dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="Cumulative Savings" 
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#DC143C" 
                strokeWidth={isMobile ? 3 : 3.5} 
                dot={{ r: isMobile ? 4 : 5, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: isMobile ? 7 : 8, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                name="25-Year Profit" 
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              <ReferenceLine y={combinedNetCost} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(combinedNetCost)}`, position: 'left', fill: '#166534', fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend moved outside chart container for mobile */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
              <span className="text-gray-700">Cumulative Savings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#DC143C]"></div>
              <span className="text-gray-700">25-Year Profit</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
        <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(profit25))}</div>
      </div>
    </div>
  )
}

