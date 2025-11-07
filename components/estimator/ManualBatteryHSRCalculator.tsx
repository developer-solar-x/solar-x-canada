"use client"

// Import React hooks for state and effects
import { useMemo, useState } from 'react'
// Import battery specs and helpers for rebate/net price
import { BATTERY_SPECS, BatterySpec, calculateBatteryFinancials } from '../../config/battery-specs'
// Import rate plan definitions for TOU/ULO
import { RATE_PLANS, RatePlan, TOU_RATE_PLAN, ULO_RATE_PLAN } from '../../config/rate-plans'
// Import simple peak-shaving calculators (solar-only, battery, and multi-year)
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION, calculateSimpleMultiYear, calculateSimplePeakShaving, calculateSolarOnlySavings, computeSolarBatteryOffsetCap } from '../../lib/simple-peak-shaving'
// Import pricing utilities for system cost from size
import { calculateSystemCost } from '../../config/pricing'

// Define the component export so the page can render it
export default function ManualBatteryHSRCalculator() {
  // Track selected rate plan (default to ULO as in step 4)
  const [ratePlan, setRatePlan] = useState<RatePlan>(ULO_RATE_PLAN)
  // Track selected battery by id (use common default)
  const [batteryId, setBatteryId] = useState<string>('renon-16')
  // Track manual annual consumption in kWh (user input)
  const [annualConsumptionKwh, setAnnualConsumptionKwh] = useState<number>(18000)
  // Track manual annual solar production in kWh (user input)
  const [annualProductionKwh, setAnnualProductionKwh] = useState<number>(8000)
  // Track manual PV system size in kW (user input)
  const [systemSizeKw, setSystemSizeKw] = useState<number>(6)

  // Resolve the selected battery spec from the database
  const battery: BatterySpec | undefined = useMemo(
    () => BATTERY_SPECS.find(b => b.id === batteryId),
    [batteryId]
  )

  // Pick usage distribution defaults based on selected rate plan
  const distribution = useMemo(
    () => (ratePlan.id === 'ulo' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION),
    [ratePlan]
  )

  // Compute solar rebate ($1,000/kW up to $5,000)
  const solarRebate = useMemo(() => {
    // Guard against invalid sizes
    const safeKw = Math.max(0, Number.isFinite(systemSizeKw) ? systemSizeKw : 0)
    // Apply fixed rules from step 4
    const perKw = 1000
    const max = 5000
    // Cap the rebate at the program maximum
    return Math.min(Math.round(safeKw * perKw), max)
  }, [systemSizeKw])

  // Compute system cost using tiered pricing utility
  const solarSystemCost = useMemo(() => {
    // Use helper to get total turnkey cost
    return calculateSystemCost(Math.max(0, systemSizeKw || 0))
  }, [systemSizeKw])

  // Compute battery rebate and net battery price
  const batteryFinancials = useMemo(() => {
    // If battery missing, return safe zeros
    if (!battery) return { rebate: 0, netPrice: 0, battery }
    // Use helper to calculate rebate and net price
    const fin = calculateBatteryFinancials(battery)
    // Return succinct object for downstream use
    return { rebate: fin.rebate, netPrice: fin.netPrice, battery }
  }, [battery])

  // Compute solar-only annual savings based on manual inputs
  const solarOnly = useMemo(() => {
    // If rate plan missing, default to TOU
    const plan = ratePlan || TOU_RATE_PLAN
    // Use helper to calculate before/after and annual savings
    return calculateSolarOnlySavings(
      Math.max(0, annualConsumptionKwh || 0),
      Math.max(0, annualProductionKwh || 0),
      plan,
      distribution
    )
  }, [annualConsumptionKwh, annualProductionKwh, ratePlan, distribution])

  // Compute battery-only savings using simple peak-shaving model
  const batteryOnly = useMemo(() => {
    // Return safe zeros if battery undefined
    if (!battery) return null
    // Calculate battery impact with rate plan and distribution
    return calculateSimplePeakShaving(
      Math.max(0, annualConsumptionKwh || 0),
      battery,
      ratePlan,
      distribution,
      Math.max(0, annualProductionKwh || 0)
    )
  }, [annualConsumptionKwh, annualProductionKwh, battery, ratePlan, distribution])

  // Combine solar and battery savings for overall picture
  const combined = useMemo(() => {
    // Handle missing battery by treating battery savings as zero
    const batteryAnnual = batteryOnly?.annualSavings || 0
    // Sum solar and battery savings per step 4 rule
    const annual = Math.max(0, Math.round(solarOnly.annualSavings + batteryAnnual))
    // Compute monthly savings as a convenience figure
    const monthly = Math.round(annual / 12)
    // Compute net costs combining solar net and battery net
    const solarNet = Math.max(0, solarSystemCost - solarRebate)
    const batteryNet = Math.max(0, batteryFinancials.netPrice || 0)
    const net = Math.max(0, solarNet + batteryNet)
    // Apply 5% escalation and 25-year horizon for long-term view
    const projection = calculateSimpleMultiYear({ annualSavings: annual } as any, net, 0.05, 25)
    // Return combined results object for display
    return { annual, monthly, net, projection }
  }, [solarOnly, batteryOnly, solarSystemCost, solarRebate, batteryFinancials])

  const offsetCapInfo = useMemo(() => (
    computeSolarBatteryOffsetCap({
      usageKwh: Math.max(0, annualConsumptionKwh || 0),
      productionKwh: Math.max(0, annualProductionKwh || 0),
    })
  ), [annualConsumptionKwh, annualProductionKwh])
  const offsetCapPercent = Math.min(100, Math.max(0, offsetCapInfo.capFraction * 100))
  const gridEnergyPercent = Math.max(0, Math.min(100, 100 - offsetCapPercent))
  const gridEnergyKwh = (gridEnergyPercent / 100) * Math.max(0, annualConsumptionKwh || 0)
  const savingsPercent = Math.max(0, Math.min(100, batteryOnly ? 100 - (batteryOnly.leftoverEnergy.costPercent || 0) : 0))

  // Render the manual calculator UI
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title and context for the user */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy-500">Manual Battery Peak-Shaving (HSR Step 4)</h1>
        <p className="text-gray-600">Enter your own system size, production, and consumption. We match Step 4 math without NREL.</p>
      </div>

      {/* Input card for manual fields */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xl font-semibold text-navy-500">Your Inputs</h2>

        {/* Rate plan selector between ULO and TOU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rate Plan</label>
            <select
              className="input"
              value={ratePlan.id}
              onChange={(e) => setRatePlan(e.target.value === 'ulo' ? ULO_RATE_PLAN : TOU_RATE_PLAN)}
            >
              {RATE_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

          {/* Manual annual consumption input */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Annual Consumption (kWh)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={annualConsumptionKwh}
              onChange={(e) => setAnnualConsumptionKwh(Number(e.target.value))}
            />
          </div>

          {/* Manual annual production input */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Annual Production (kWh)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={annualProductionKwh}
              onChange={(e) => setAnnualProductionKwh(Number(e.target.value))}
            />
          </div>
        </div>

        {/* System size and battery selection row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">System Size (kW)</label>
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={systemSizeKw}
              onChange={(e) => setSystemSizeKw(Number(e.target.value))}
            />
          </div>

          {/* Battery selector from catalog */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Battery</label>
            <select
              className="input"
              value={batteryId}
              onChange={(e) => setBatteryId(e.target.value)}
            >
              {BATTERY_SPECS.map(b => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model} • {b.usableKwh} kWh usable • ${b.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rebates and costs summary card */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold text-navy-500">Rebates & Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Solar System Cost</div>
            <div className="text-lg font-bold">${solarSystemCost.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Solar Rebate</div>
            <div className="text-lg font-bold text-green-600">-${solarRebate.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Battery Rebate</div>
            <div className="text-lg font-bold text-green-600">-${(batteryFinancials.rebate || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Total Net Cost</div>
            <div className="text-lg font-bold">${combined.net.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Savings and payback card */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xl font-semibold text-navy-500">Savings & Payback</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Year 1 Annual Savings</div>
            <div className="text-2xl font-bold text-green-600">${combined.annual.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Monthly ~ ${combined.monthly.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">Payback Period</div>
            <div className="text-2xl font-bold">{combined.projection.paybackYears || 0} years</div>
            <div className="text-xs text-gray-500">0 years if net ≤ 0</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-xs text-gray-600">25-Year Net Profit</div>
            <div className="text-2xl font-bold">${combined.projection.netProfit25Year.toLocaleString()}</div>
            <div className="text-xs text-gray-500">5% annual rate escalation</div>
          </div>
        </div>
      </div>

      {/* Breakdown card for transparency */}
      <div className="card p-5 space-y-3">
        <h2 className="text-xl font-semibold text-navy-500">Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-sm font-medium text-gray-700">Solar-Only Annual Savings</div>
            <div className="text-lg font-bold text-green-700">${Math.round(solarOnly.annualSavings).toLocaleString()}</div>
            <div className="text-xs text-gray-600">Manual production used; offsets highest-cost periods first</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-sm font-medium text-gray-700">Battery-Only Annual Savings</div>
            <div className="text-lg font-bold text-green-700">${Math.round(batteryOnly?.annualSavings || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-600">Battery charges at cheapest rate; discharges at peak</div>
          </div>
        </div>
      </div>

      {/* Offset vs Savings */}
      <div className="card p-5 space-y-4">
        <h2 className="text-xl font-semibold text-navy-500">Offset vs Savings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="text-xs text-gray-600">Offset (solar + battery)</div>
            <div className="text-3xl font-bold text-green-600">{offsetCapPercent.toFixed(2)}%</div>
            <div className="text-xs text-gray-500">{((offsetCapPercent / 100) * Math.max(0, annualConsumptionKwh || 0)).toFixed(0)} kWh/year</div>
            <div className="text-[11px] text-amber-600 mt-2">
              Winter limits cap the offset to {offsetCapPercent.toFixed(0)}%.
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="text-xs text-gray-600">Total savings (first year)</div>
            <div className="text-3xl font-bold text-blue-600">{savingsPercent.toFixed(2)}%</div>
            <div className="text-xs text-gray-500">≈ ${combined.annual.toLocaleString()} saved</div>
            <div className="text-[11px] text-blue-600 mt-2">
              Savings are higher because any remaining energy is bought at low overnight rates.
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
            <div className="text-xs text-gray-600">Bought from the grid (cheap hours)</div>
            <div className="text-3xl font-bold text-red-600">{gridEnergyPercent.toFixed(2)}%</div>
            <div className="text-xs text-gray-500">{gridEnergyKwh.toFixed(0)} kWh/year at low rates</div>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Offset tells you how much consumption the system covers even in winter; savings show how little of the original bill remains thanks to low-rate top-ups.
        </p>
      </div>
    </div>
  )
}




