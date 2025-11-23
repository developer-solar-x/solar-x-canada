'use client'

import { Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { asNumber, getCombinedBlock } from '../utils'

interface PeakShavingTabProps {
  lead: any
  peakShaving: any
  touAnnual: number | null
  uloAnnual: number | null
  touPayback: number | null
  uloPayback: number | null
  onInfoClick: (plan: 'TOU' | 'ULO') => void
}

export function PeakShavingTab({
  lead,
  peakShaving,
  touAnnual,
  uloAnnual,
  touPayback,
  uloPayback,
  onInfoClick,
}: PeakShavingTabProps) {
  return (
    <div className="space-y-6">
      {/* Annual Usage Summary */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-navy-500">Customer's Annual Energy Usage</h3>
        </div>
        <div className="text-3xl font-bold text-blue-700">
          {(asNumber(lead.annual_usage_kwh) ?? 0).toLocaleString()} kWh/year
        </div>
        <div className="text-sm text-blue-600 mt-1">
          This is how much electricity they use in a year
        </div>
      </div>

      {/* Explanation */}
      <div className="card p-4 bg-yellow-50 border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>What is Peak Shaving?</strong> This shows how much money the customer can save by using solar panels and a battery to reduce their electricity costs during expensive peak hours. We compare two rate plans: Time-of-Use (TOU) and Ultra-Low Overnight (ULO).
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* TOU Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-navy-500">Time-of-Use Plan (TOU)</h3>
              <p className="text-xs text-gray-500 mt-1">Rates change based on time of day</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Solar + Battery</span>
            <button onClick={() => onInfoClick('TOU')} className="ml-2 text-xs underline text-blue-700 hover:text-blue-900">How this is calculated</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Yearly Savings</div>
              <div className="font-semibold text-navy-600">{touAnnual ? formatCurrency(touAnnual) : '—'}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Monthly Savings</div>
              <div className="font-semibold text-navy-600">
                {lead.tou_monthly_savings != null 
                  ? formatCurrency(lead.tou_monthly_savings)
                  : (getCombinedBlock(peakShaving?.tou)?.monthly ? formatCurrency(getCombinedBlock(peakShaving?.tou)?.monthly) : '—')}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Payback Time</div>
              <div className="font-semibold text-navy-600">{typeof touPayback === 'number' ? `${touPayback.toFixed(1)} yrs` : '—'}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">25-Year Profit</div>
              <div className="font-semibold text-green-700">
                {lead.tou_profit_25_year != null
                  ? formatCurrency(lead.tou_profit_25_year)
                  : (getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year != null ? formatCurrency(getCombinedBlock(peakShaving?.tou)?.projection?.netProfit25Year) : '—')}
              </div>
            </div>
          </div>
          {/* Bill Savings Percentage */}
          {lead.tou_total_bill_savings_percent != null && (
            <div className="mt-3 bg-blue-50 rounded p-3 text-center">
              <div className="text-[11px] text-gray-600">Total Bill Savings</div>
              <div className="text-lg font-bold text-blue-700">{lead.tou_total_bill_savings_percent.toFixed(1)}%</div>
            </div>
          )}
          {/* Costs */}
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div className="bg-white rounded border p-3">
              <div className="text-[11px] text-gray-600">Current Electricity Cost</div>
              <div className="font-semibold">
                {lead.tou_before_solar != null 
                  ? formatCurrency(lead.tou_before_solar)
                  : (peakShaving?.tou?.result?.originalCost?.total != null ? formatCurrency(peakShaving.tou.result.originalCost.total) : '—')}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Without solar</div>
            </div>
            {lead.tou_after_solar != null && (
              <div className="bg-green-50 rounded border border-green-200 p-3">
                <div className="text-[11px] text-gray-600">After Solar + Battery</div>
                <div className="font-semibold text-green-700">{formatCurrency(lead.tou_after_solar)}</div>
                <div className="text-[10px] text-gray-500 mt-1">With system</div>
              </div>
            )}
          </div>
          {/* Offset Percentages */}
          {(lead.tou_solar != null || lead.tou_battery_solar_capture != null || lead.tou_total_offset != null) && (
            <div className="mt-3 bg-blue-50 rounded p-3 text-xs">
              <div className="font-semibold text-gray-700 mb-2">Energy Offset Breakdown</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {lead.tou_solar != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Solar Direct</div>
                    <div className="font-semibold text-blue-700">{lead.tou_solar.toFixed(1)}%</div>
                  </div>
                )}
                {lead.tou_battery_solar_capture != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Battery Capture</div>
                    <div className="font-semibold text-blue-700">{lead.tou_battery_solar_capture.toFixed(1)}%</div>
                  </div>
                )}
                {lead.tou_total_offset != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Total Offset</div>
                    <div className="font-semibold text-blue-700">{lead.tou_total_offset.toFixed(1)}%</div>
                  </div>
                )}
              </div>
              {lead.tou_buy_from_grid != null && (
                <div className="mt-2 text-center">
                  <div className="text-[10px] text-gray-600">Buy from Grid</div>
                  <div className="font-semibold text-gray-700">{lead.tou_buy_from_grid.toFixed(1)}%</div>
                </div>
              )}
            </div>
          )}
          {/* Usage + Offsets */}
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded p-3">
              <div className="font-semibold text-gray-700 mb-1">Energy Used During Different Times</div>
              <div className="text-gray-700 mt-1">
                {peakShaving?.tou?.result?.usageByPeriod ? (
                  <>
                    <div>Peak hours: {peakShaving.tou.result.usageByPeriod.onPeak?.toLocaleString()} kWh</div>
                    <div>Mid-peak: {peakShaving.tou.result.usageByPeriod.midPeak?.toLocaleString()} kWh</div>
                    <div>Off-peak: {peakShaving.tou.result.usageByPeriod.offPeak?.toLocaleString()} kWh</div>
                  </>
                ) : '—'}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-semibold text-gray-700 mb-1">Energy Covered by Battery</div>
              <div className="text-gray-700 mt-1">
                {peakShaving?.tou?.result?.batteryOffsets ? (
                  <>
                    <div>Peak hours: {peakShaving.tou.result.batteryOffsets.onPeak?.toLocaleString()} kWh</div>
                    <div>Mid-peak: {peakShaving.tou.result.batteryOffsets.midPeak?.toLocaleString()} kWh</div>
                    <div>Off-peak: {peakShaving.tou.result.batteryOffsets.offPeak?.toLocaleString()} kWh</div>
                  </>
                ) : '—'}
              </div>
            </div>
          </div>
          {peakShaving?.tou?.result?.leftoverEnergy && (
            <div className="mt-3 text-[12px] bg-blue-50 border border-blue-200 rounded p-3 text-blue-800">
              <div className="font-semibold mb-1">Energy Still Needed from Grid</div>
              <div>
                <span className="font-semibold">{peakShaving.tou.result.leftoverEnergy.totalKwh?.toLocaleString()} kWh</span> per year at {peakShaving.tou.result.leftoverEnergy.ratePerKwh ?? '—'} per kWh
              </div>
              <div className="mt-1">This represents only {Math.round((peakShaving.tou.result.leftoverEnergy.costPercent || 0) * 10) / 10}% of their total electricity bill</div>
            </div>
          )}
        </div>

        {/* ULO Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-navy-500">Ultra-Low Overnight Plan (ULO)</h3>
              <p className="text-xs text-gray-500 mt-1">Cheaper rates overnight</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Solar + Battery</span>
            <button onClick={() => onInfoClick('ULO')} className="ml-2 text-xs underline text-emerald-700 hover:text-emerald-900">How this is calculated</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Yearly Savings</div>
              <div className="font-semibold text-navy-600">{uloAnnual ? formatCurrency(uloAnnual) : '—'}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Monthly Savings</div>
              <div className="font-semibold text-navy-600">
                {lead.ulo_monthly_savings != null 
                  ? formatCurrency(lead.ulo_monthly_savings)
                  : (getCombinedBlock(peakShaving?.ulo)?.monthly ? formatCurrency(getCombinedBlock(peakShaving?.ulo)?.monthly) : '—')}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">Payback Time</div>
              <div className="font-semibold text-navy-600">{typeof uloPayback === 'number' ? `${uloPayback.toFixed(1)} yrs` : '—'}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-[11px] text-gray-600">25-Year Profit</div>
              <div className="font-semibold text-green-700">
                {lead.ulo_profit_25_year != null
                  ? formatCurrency(lead.ulo_profit_25_year)
                  : (getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year != null ? formatCurrency(getCombinedBlock(peakShaving?.ulo)?.projection?.netProfit25Year) : '—')}
              </div>
            </div>
          </div>
          {/* Bill Savings Percentage */}
          {lead.ulo_total_bill_savings_percent != null && (
            <div className="mt-3 bg-emerald-50 rounded p-3 text-center">
              <div className="text-[11px] text-gray-600">Total Bill Savings</div>
              <div className="text-lg font-bold text-emerald-700">{lead.ulo_total_bill_savings_percent.toFixed(1)}%</div>
            </div>
          )}
          {/* Costs */}
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div className="bg-white rounded border p-3">
              <div className="text-[11px] text-gray-600">Current Electricity Cost</div>
              <div className="font-semibold">
                {lead.ulo_before_solar != null 
                  ? formatCurrency(lead.ulo_before_solar)
                  : (peakShaving?.ulo?.result?.originalCost?.total != null ? formatCurrency(peakShaving.ulo.result.originalCost.total) : '—')}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Without solar</div>
            </div>
            {lead.ulo_after_solar != null && (
              <div className="bg-green-50 rounded border border-green-200 p-3">
                <div className="text-[11px] text-gray-600">After Solar + Battery</div>
                <div className="font-semibold text-green-700">{formatCurrency(lead.ulo_after_solar)}</div>
                <div className="text-[10px] text-gray-500 mt-1">With system</div>
              </div>
            )}
          </div>
          {/* Offset Percentages */}
          {(lead.ulo_solar != null || lead.ulo_battery_solar_capture != null || lead.ulo_total_offset != null) && (
            <div className="mt-3 bg-emerald-50 rounded p-3 text-xs">
              <div className="font-semibold text-gray-700 mb-2">Energy Offset Breakdown</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {lead.ulo_solar != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Solar Direct</div>
                    <div className="font-semibold text-emerald-700">{lead.ulo_solar.toFixed(1)}%</div>
                  </div>
                )}
                {lead.ulo_battery_solar_capture != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Battery Capture</div>
                    <div className="font-semibold text-emerald-700">{lead.ulo_battery_solar_capture.toFixed(1)}%</div>
                  </div>
                )}
                {lead.ulo_total_offset != null && (
                  <div>
                    <div className="text-[10px] text-gray-600">Total Offset</div>
                    <div className="font-semibold text-emerald-700">{lead.ulo_total_offset.toFixed(1)}%</div>
                  </div>
                )}
              </div>
              {lead.ulo_buy_from_grid != null && (
                <div className="mt-2 text-center">
                  <div className="text-[10px] text-gray-600">Buy from Grid</div>
                  <div className="font-semibold text-gray-700">{lead.ulo_buy_from_grid.toFixed(1)}%</div>
                </div>
              )}
            </div>
          )}
          {/* Usage + Offsets */}
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded p-3">
              <div className="font-semibold text-gray-700 mb-1">Energy Used During Different Times</div>
              <div className="text-gray-700 mt-1">
                {peakShaving?.ulo?.result?.usageByPeriod ? (
                  <>
                    <div>Peak hours: {peakShaving.ulo.result.usageByPeriod.onPeak?.toLocaleString()} kWh</div>
                    <div>Mid-peak: {peakShaving.ulo.result.usageByPeriod.midPeak?.toLocaleString()} kWh</div>
                    <div>Off-peak: {peakShaving.ulo.result.usageByPeriod.offPeak?.toLocaleString()} kWh</div>
                    <div>Ultra-low: {peakShaving.ulo.result.usageByPeriod.ultraLow?.toLocaleString()} kWh</div>
                  </>
                ) : '—'}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-semibold text-gray-700 mb-1">Energy Covered by Battery</div>
              <div className="text-gray-700 mt-1">
                {peakShaving?.ulo?.result?.batteryOffsets ? (
                  <>
                    <div>Peak hours: {peakShaving.ulo.result.batteryOffsets.onPeak?.toLocaleString()} kWh</div>
                    <div>Mid-peak: {peakShaving.ulo.result.batteryOffsets.midPeak?.toLocaleString()} kWh</div>
                    <div>Off-peak: {peakShaving.ulo.result.batteryOffsets.offPeak?.toLocaleString()} kWh</div>
                  </>
                ) : '—'}
              </div>
            </div>
          </div>
          {peakShaving?.ulo?.result?.leftoverEnergy && (
            <div className="mt-3 text-[12px] bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-800">
              <div className="font-semibold mb-1">Energy Still Needed from Grid</div>
              <div>
                <span className="font-semibold">{peakShaving.ulo.result.leftoverEnergy.totalKwh?.toLocaleString()} kWh</span> per year at {peakShaving.ulo.result.leftoverEnergy.ratePerKwh ?? '—'} per kWh
              </div>
              <div className="mt-1">This represents only {Math.round((peakShaving.ulo.result.leftoverEnergy.costPercent || 0) * 10) / 10}% of their total electricity bill</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

