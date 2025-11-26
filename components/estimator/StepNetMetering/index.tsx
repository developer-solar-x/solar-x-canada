'use client'

// Net Metering Savings Step
// Replaces Battery Savings step for net_metering program type
// Allows TOU/ULO rate plan selection and displays net metering credits

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Zap, AlertTriangle, Info, Sun, Moon, BarChart3 } from 'lucide-react'
import type { NetMeteringResult } from '@/lib/net-metering'
import type { EstimatorData } from '@/app/estimator/page'
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION, type UsageDistribution, calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { BLENDED_RATE } from '../StepEnergySimple/constants'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { formatCurrency } from '@/lib/utils'

interface StepNetMeteringProps {
  data: EstimatorData
  onComplete: (data: Partial<EstimatorData>) => void
  onBack: () => void
}

export function StepNetMetering({ data, onComplete, onBack }: StepNetMeteringProps) {
  const [touResults, setTouResults] = useState<NetMeteringResult | null>(null)
  const [uloResults, setUloResults] = useState<NetMeteringResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localEstimate, setLocalEstimate] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'distribution' | 'detailed'>('basic')
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)

  // Get production and usage data - use local estimate if available, otherwise use data.estimate
  const estimate = localEstimate || data.estimate
  const monthlyProduction = estimate?.production?.monthlyKwh || []
  
  // Calculate annual usage - try multiple sources with fallbacks
  // Use BLENDED_RATE (22.3¢/kWh) which includes energy + delivery + regulatory + HST
  const annualUsageKwh = 
    data.energyUsage?.annualKwh || 
    data.annualUsageKwh || 
    (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)

  // Calculate payback period and 25-year profit for net metering
  // Annual savings = import cost - net annual bill (how much you save)
  const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
    if (netCost <= 0 || firstYearSavings <= 0) return Infinity
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

  // Get net cost and escalation rate
  const netCost = estimate?.costs?.netCost || 0
  const escalation = data.annualEscalator || data.annual_escalator || 0.03 // Default 3%

  // Calculate annual savings, payback, and 25-year profit for TOU and ULO
  const touAnnualSavings = touResults ? touResults.annual.importCost - touResults.annual.netAnnualBill : 0
  const uloAnnualSavings = uloResults ? uloResults.annual.importCost - uloResults.annual.netAnnualBill : 0
  
  const touPaybackYears = touResults && netCost > 0 ? calculatePayback(touAnnualSavings, netCost, escalation) : Infinity
  const uloPaybackYears = uloResults && netCost > 0 ? calculatePayback(uloAnnualSavings, netCost, escalation) : Infinity
  
  const touProfit25 = touResults && netCost > 0 
    ? calculateSimpleMultiYear({ annualSavings: touAnnualSavings } as any, netCost, escalation, 25).netProfit25Year
    : 0
  const uloProfit25 = uloResults && netCost > 0
    ? calculateSimpleMultiYear({ annualSavings: uloAnnualSavings } as any, netCost, escalation, 25).netProfit25Year
    : 0

  // Fetch estimate if not available
  useEffect(() => {
    const fetchEstimate = async () => {
      // Check if we have the required data to fetch estimate
      if (!data.coordinates || (!data.roofPolygon && !data.roofAreaSqft)) {
        setError('Location and roof information are required. Please go back and complete previous steps.')
        setLoading(false)
        return
      }

      // If estimate is missing or incomplete, fetch it
      if (!estimate?.production?.monthlyKwh || monthlyProduction.length !== 12) {
        try {
          setLoading(true)
          setError(null)
          
          const response = await fetch('/api/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coordinates: data.coordinates,
              roofPolygon: data.roofPolygon,
              roofAreaSqft: data.roofAreaSqft,
              roofType: data.roofType,
              roofAge: data.roofAge,
              roofPitch: data.roofPitch,
              shadingLevel: data.shadingLevel,
              monthlyBill: data.monthlyBill,
              annualUsageKwh: annualUsageKwh,
              energyUsage: data.energyUsage,
              province: 'ON',
              roofAzimuth: data.roofAzimuth || 180,
              programType: data.programType || 'net_metering',
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to generate solar production estimate')
          }

          const result = await response.json()
          
          if (result.data?.production?.monthlyKwh && result.data.production.monthlyKwh.length === 12) {
            setLocalEstimate(result.data)
            // Don't set loading to false here - let the net metering calculation useEffect handle it
          } else {
            throw new Error('Invalid estimate data received - missing monthly production data')
          }
        } catch (err) {
          console.error('Error fetching estimate:', err)
          setError(err instanceof Error ? err.message : 'Failed to generate solar production estimate. Please try again.')
          setLoading(false)
        }
      }
      // If estimate already exists and is valid, don't change loading state
      // Let the net metering calculation useEffect handle setting loading to false
    }

    fetchEstimate()
  }, [data.coordinates, data.roofPolygon, data.roofAreaSqft, data.roofType, data.roofPitch, data.shadingLevel, annualUsageKwh, estimate, monthlyProduction.length])

  // Calculate net metering for both plans
  useEffect(() => {
    const currentEstimate = localEstimate || data.estimate
    const currentMonthlyProduction = currentEstimate?.production?.monthlyKwh || []
    
    if (!currentEstimate?.production?.monthlyKwh || currentMonthlyProduction.length !== 12) {
      return
    }

    // Recalculate annual usage here to ensure we have the latest value
    const calculatedAnnualUsage = 
      data.energyUsage?.annualKwh || 
      data.annualUsageKwh || 
      (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)

    if (calculatedAnnualUsage <= 0) {
      setError('Annual usage is required for net metering calculations. Please go back to the Details step and enter your monthly bill or annual usage.')
      setLoading(false)
      return
    }

    const calculateNetMetering = async (planId: 'tou' | 'ulo') => {
      try {
        setError(null)
        
        // Use the current monthly production from the estimate
        const monthlyProd = currentEstimate.production.monthlyKwh

        // Recalculate annual usage to ensure we have the latest value
        const calculatedAnnualUsage = 
          data.energyUsage?.annualKwh || 
          data.annualUsageKwh || 
          (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)

        const distribution = planId === 'ulo' ? uloDistribution : touDistribution
        
        const response = await fetch('/api/net-metering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlySolarProduction: monthlyProd,
            annualUsageKwh: calculatedAnnualUsage,
            ratePlanId: planId,
            year: new Date().getFullYear(),
            usageDistribution: distribution,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate net metering')
        }

        const result = await response.json()
        
        if (planId === 'tou') {
          setTouResults(result.data)
        } else {
          setUloResults(result.data)
        }
      } catch (err) {
        console.error('Net metering calculation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to calculate net metering')
      } finally {
        // Only set loading to false when both calculations are complete
        if (planId === 'ulo') {
          setLoading(false)
        }
      }
    }

    // Calculate both plans simultaneously
    calculateNetMetering('tou')
    calculateNetMetering('ulo')
  }, [localEstimate, data.estimate, data.energyUsage?.annualKwh, data.annualUsageKwh, data.monthlyBill, touDistribution, uloDistribution])

  const handleContinue = () => {
    if (!touResults || !uloResults) {
      setError('Please wait for calculations to complete')
      return
    }

    // Determine which plan has better savings (for default selection)
    const betterPlan = uloResults.annual.exportCredits > touResults.annual.exportCredits ? 'ulo' : 'tou'

    // Recalculate payback and profit at save time to ensure we have the latest values
    const currentEstimate = localEstimate || data.estimate
    const currentNetCost = currentEstimate?.costs?.netCost || 0
    const currentEscalation = data.annualEscalator || data.annual_escalator || 0.03
    
    const currentTouAnnualSavings = touResults.annual.importCost - touResults.annual.netAnnualBill
    const currentUloAnnualSavings = uloResults.annual.importCost - uloResults.annual.netAnnualBill
    
    const currentTouPaybackYears = currentNetCost > 0 ? calculatePayback(currentTouAnnualSavings, currentNetCost, currentEscalation) : Infinity
    const currentUloPaybackYears = currentNetCost > 0 ? calculatePayback(currentUloAnnualSavings, currentNetCost, currentEscalation) : Infinity
    
    const currentTouProfit25 = currentNetCost > 0 
      ? calculateSimpleMultiYear({ annualSavings: currentTouAnnualSavings } as any, currentNetCost, currentEscalation, 25).netProfit25Year
      : 0
    const currentUloProfit25 = currentNetCost > 0
      ? calculateSimpleMultiYear({ annualSavings: currentUloAnnualSavings } as any, currentNetCost, currentEscalation, 25).netProfit25Year
      : 0

    // Save net metering data and include estimate if we fetched it locally
    onComplete({
      ...(localEstimate && !data.estimate ? { estimate: localEstimate } : {}),
      netMetering: {
        tou: {
          ...touResults,
          projection: {
            paybackYears: currentTouPaybackYears === Infinity ? null : currentTouPaybackYears,
            netProfit25Year: currentTouProfit25,
            annualSavings: currentTouAnnualSavings,
          }
        },
        ulo: {
          ...uloResults,
          projection: {
            paybackYears: currentUloPaybackYears === Infinity ? null : currentUloPaybackYears,
            netProfit25Year: currentUloProfit25,
            annualSavings: currentUloAnnualSavings,
          }
        },
        selectedRatePlan: betterPlan,
      },
      // Also store in peakShaving structure for compatibility
      peakShaving: {
        ratePlan: betterPlan,
        annualUsageKwh: annualUsageKwh,
        tou: {
          result: {
            annualSavings: touResults.annual.exportCredits || 0,
            totalUsageKwh: annualUsageKwh,
          },
          combined: {
            annual: touResults.annual.exportCredits || 0,
            monthly: (touResults.annual.exportCredits || 0) / 12,
          }
        },
        ulo: {
          result: {
            annualSavings: uloResults.annual.exportCredits || 0,
            totalUsageKwh: annualUsageKwh,
          },
          combined: {
            annual: uloResults.annual.exportCredits || 0,
            monthly: (uloResults.annual.exportCredits || 0) / 12,
          }
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-500 mb-2">Net Metering Savings</h1>
          <p className="text-gray-600">
            Compare how much you can save with net metering credits on both TOU and ULO rate plans
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
            <Loader2 className="animate-spin text-navy-500 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Calculating net metering credits for both plans...</p>
          </div>
        )}

        {/* Results - 2 Column Comparison Layout */}
        {!loading && (touResults || uloResults) && (
          <div className="mb-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'bg-navy-50 text-navy-700 border-b-2 border-navy-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Quick Comparison
                </button>
                <button
                  onClick={() => setActiveTab('distribution')}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                    activeTab === 'distribution'
                      ? 'bg-navy-50 text-navy-700 border-b-2 border-navy-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Usage Distribution
                </button>
                <button
                  onClick={() => setActiveTab('detailed')}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors ${
                    activeTab === 'detailed'
                      ? 'bg-navy-50 text-navy-700 border-b-2 border-navy-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Detailed Analysis
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <>
            {/* System Specifications - Full Width */}
            {(estimate?.system?.sizeKw || estimate?.system?.numPanels) && (
              <div className="bg-gradient-to-br from-navy-50 to-slate-50 rounded-lg p-5 border-2 border-navy-200 mb-6">
                <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <Zap className="text-navy-500" size={18} />
                  System Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {estimate?.system?.sizeKw && (
                    <div>
                      <span className="text-xs text-gray-600">System Size</span>
                      <p className="text-xl font-bold text-navy-900">{estimate.system.sizeKw.toFixed(1)} kW</p>
                    </div>
                  )}
                  {estimate?.system?.numPanels && (
                    <div>
                      <span className="text-xs text-gray-600">Number of Panels</span>
                      <p className="text-xl font-bold text-navy-900">{estimate.system.numPanels} panels</p>
                    </div>
                  )}
                  {estimate?.production?.annualKwh && (
                    <div>
                      <span className="text-xs text-gray-600">Annual Production</span>
                      <p className="text-xl font-bold text-navy-900">{Math.round(estimate.production.annualKwh).toLocaleString()} kWh</p>
                    </div>
                  )}
                  {annualUsageKwh > 0 && (
                    <div>
                      <span className="text-xs text-gray-600">Annual Usage</span>
                      <p className="text-xl font-bold text-navy-900">{Math.round(annualUsageKwh).toLocaleString()} kWh</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Offset Summary - Prominent Display */}
            {touResults && uloResults && (
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200 shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-500 rounded-lg">
                    <BarChart3 className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-emerald-900">Net Metering Offset Summary</h2>
                      <InfoTooltip 
                        content="Net metering allows you to earn credits for excess solar energy exported to the grid. These credits offset your electricity costs. The offset percentage shows what portion of your annual bill is covered by credits."
                        iconSize={16}
                      />
                    </div>
                    <p className="text-sm text-emerald-700">Your bill reduction with solar credits</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      TOU Plan Offset
                      <InfoTooltip 
                        content="The percentage of your TOU plan annual electricity bill that is offset by net metering credits. A value over 100% means your credits exceed your import costs."
                        iconSize={12}
                      />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 mb-2">{touResults.annual.billOffsetPercent.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mb-2">
                      ${touResults.annual.importCost.toFixed(0)} → ${Math.abs(touResults.annual.netAnnualBill).toFixed(0)}
                      {touResults.annual.netAnnualBill < 0 && ' (credit balance)'}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, touResults.annual.billOffsetPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      ULO Plan Offset
                      <InfoTooltip 
                        content="The percentage of your ULO plan annual electricity bill that is offset by net metering credits. A value over 100% means your credits exceed your import costs."
                        iconSize={12}
                      />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 mb-2">{uloResults.annual.billOffsetPercent.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mb-2">
                      ${uloResults.annual.importCost.toFixed(0)} → ${Math.abs(uloResults.annual.netAnnualBill).toFixed(0)}
                      {uloResults.annual.netAnnualBill < 0 && ' (credit balance)'}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, uloResults.annual.billOffsetPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2 Column Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* TOU Results */}
              {touResults && (
                <div className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Time-of-Use (TOU)</h2>
                    <p className="text-sm text-blue-100 mt-1">Standard time-based pricing</p>
                  </div>
                  <div className="p-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="text-xs text-emerald-700 mb-1">Annual Credits</div>
                        <div className="text-2xl font-bold text-emerald-900">
                          ${touResults.annual.exportCredits.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                          Bill Offset
                          <InfoTooltip 
                            content="The percentage of your annual electricity bill that is offset by net metering credits. A value over 100% means your credits exceed your import costs, resulting in a credit balance."
                            iconSize={14}
                          />
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {touResults.annual.billOffsetPercent.toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs text-gray-700 mb-1">Net Annual Bill</div>
                        <div className={`text-xl font-bold ${touResults.annual.netAnnualBill < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                          ${Math.abs(touResults.annual.netAnnualBill).toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs text-gray-700 mb-1">Exported</div>
                        <div className="text-xl font-bold text-gray-900">
                          {Math.round(touResults.annual.totalExported).toLocaleString()} kWh
                        </div>
                      </div>
                    </div>

                    {/* Payback & 25-Year Profit */}
                    {netCost > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <div className="text-xs text-blue-700 mb-1">Payback Period</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {touPaybackYears === Infinity ? 'N/A' : `${touPaybackYears.toFixed(1)} yrs`}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                          <div className="text-xs text-green-700 mb-1">25-Year Profit</div>
                          <div className={`text-2xl font-bold ${touProfit25 >= 0 ? 'text-green-900' : 'text-gray-700'}`}>
                            {touProfit25 >= 0 ? '+' : ''}{formatCurrency(Math.round(touProfit25))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Before/After Comparison */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 mb-4">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        Annual Bill Comparison
                        <InfoTooltip 
                          content="Shows your annual electricity costs before and after applying net metering credits. Before Solar is what you would pay without solar. After Credits is your net bill after export credits are applied. Annual Savings is the difference."
                          iconSize={14}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Before Solar:</span>
                          <span className="text-sm font-bold text-gray-900">${touResults.annual.importCost.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">After Credits:</span>
                          <span className={`text-sm font-bold ${touResults.annual.netAnnualBill < 0 ? 'text-green-600' : 'text-navy-900'}`}>
                            ${Math.abs(touResults.annual.netAnnualBill).toFixed(0)}
                            {touResults.annual.netAnnualBill < 0 && ' (credit)'}
                          </span>
                        </div>
                        <div className="pt-1 mt-1 border-t border-blue-200 flex justify-between items-center">
                          <span className="text-xs font-semibold text-green-700">Annual Savings:</span>
                          <span className="text-sm font-bold text-green-600">
                            ${Math.max(0, touResults.annual.importCost - touResults.annual.netAnnualBill).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Energy Coverage */}
                    {touResults.annual.totalLoad > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                            Energy Coverage
                            <InfoTooltip 
                              content="The percentage of your annual electricity usage that is covered by your solar system's production. This shows how much of your consumption is met directly by solar energy rather than grid imports."
                              iconSize={14}
                            />
                          </div>
                          <p className="text-sm font-bold text-navy-900">
                            {((touResults.annual.totalSolarProduction / touResults.annual.totalLoad) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(100, (touResults.annual.totalSolarProduction / touResults.annual.totalLoad) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(touResults.annual.totalSolarProduction).toLocaleString()} kWh produced / {Math.round(touResults.annual.totalLoad).toLocaleString()} kWh used
                        </p>
                      </div>
                    )}

                    {/* Export Credits by Period - Compact */}
                    {touResults.byPeriod && touResults.byPeriod.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Credits by Period</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {touResults.byPeriod
                            .filter(p => p.kwhExported > 0 || p.exportCredits > 0)
                            .map((period) => (
                              <div key={period.period} className="bg-gray-50 rounded p-2 text-xs">
                                <div className="font-semibold text-gray-700 capitalize mb-1">
                                  {period.period.replace('-', ' ')}
                                </div>
                                <div className="text-emerald-700 font-bold">
                                  ${period.exportCredits.toFixed(0)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ULO Results */}
              {uloResults && (
                <div className={`bg-white rounded-lg border-2 overflow-hidden shadow-sm ${
                  uloResults.annual.exportCredits > (touResults?.annual.exportCredits || 0)
                    ? 'border-emerald-400 ring-2 ring-emerald-200'
                    : 'border-purple-200'
                }`}>
                  <div className={`px-6 py-4 ${
                    uloResults.annual.exportCredits > (touResults?.annual.exportCredits || 0)
                      ? 'bg-emerald-500'
                      : 'bg-purple-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Ultra-Low Overnight (ULO)</h2>
                        <p className="text-sm text-purple-100 mt-1">Best for EV owners</p>
                      </div>
                      {uloResults.annual.exportCredits > (touResults?.annual.exportCredits || 0) && (
                        <span className="bg-white text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                          BEST VALUE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="text-xs text-emerald-700 mb-1">Annual Credits</div>
                        <div className="text-2xl font-bold text-emerald-900">
                          ${uloResults.annual.exportCredits.toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                          Bill Offset
                          <InfoTooltip 
                            content="The percentage of your annual electricity bill that is offset by net metering credits. A value over 100% means your credits exceed your import costs, resulting in a credit balance."
                            iconSize={14}
                          />
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {uloResults.annual.billOffsetPercent.toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs text-gray-700 mb-1">Net Annual Bill</div>
                        <div className={`text-xl font-bold ${uloResults.annual.netAnnualBill < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                          ${Math.abs(uloResults.annual.netAnnualBill).toFixed(0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs text-gray-700 mb-1">Exported</div>
                        <div className="text-xl font-bold text-gray-900">
                          {Math.round(uloResults.annual.totalExported).toLocaleString()} kWh
                        </div>
                      </div>
                    </div>

                    {/* Payback & 25-Year Profit */}
                    {netCost > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <div className="text-xs text-purple-700 mb-1">Payback Period</div>
                          <div className="text-2xl font-bold text-purple-900">
                            {uloPaybackYears === Infinity ? 'N/A' : `${uloPaybackYears.toFixed(1)} yrs`}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                          <div className="text-xs text-green-700 mb-1">25-Year Profit</div>
                          <div className={`text-2xl font-bold ${uloProfit25 >= 0 ? 'text-green-900' : 'text-gray-700'}`}>
                            {uloProfit25 >= 0 ? '+' : ''}{formatCurrency(Math.round(uloProfit25))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Before/After Comparison */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 mb-4">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        Annual Bill Comparison
                        <InfoTooltip 
                          content="Shows your annual electricity costs before and after applying net metering credits. Before Solar is what you would pay without solar. After Credits is your net bill after export credits are applied. Annual Savings is the difference."
                          iconSize={14}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Before Solar:</span>
                          <span className="text-sm font-bold text-gray-900">${uloResults.annual.importCost.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">After Credits:</span>
                          <span className={`text-sm font-bold ${uloResults.annual.netAnnualBill < 0 ? 'text-green-600' : 'text-navy-900'}`}>
                            ${Math.abs(uloResults.annual.netAnnualBill).toFixed(0)}
                            {uloResults.annual.netAnnualBill < 0 && ' (credit)'}
                          </span>
                        </div>
                        <div className="pt-1 mt-1 border-t border-purple-200 flex justify-between items-center">
                          <span className="text-xs font-semibold text-green-700">Annual Savings:</span>
                          <span className="text-sm font-bold text-green-600">
                            ${Math.max(0, uloResults.annual.importCost - uloResults.annual.netAnnualBill).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Energy Coverage */}
                    {uloResults.annual.totalLoad > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                            Energy Coverage
                            <InfoTooltip 
                              content="The percentage of your annual electricity usage that is covered by your solar system's production. This shows how much of your consumption is met directly by solar energy rather than grid imports."
                              iconSize={14}
                            />
                          </div>
                          <p className="text-sm font-bold text-navy-900">
                            {((uloResults.annual.totalSolarProduction / uloResults.annual.totalLoad) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(100, (uloResults.annual.totalSolarProduction / uloResults.annual.totalLoad) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(uloResults.annual.totalSolarProduction).toLocaleString()} kWh produced / {Math.round(uloResults.annual.totalLoad).toLocaleString()} kWh used
                        </p>
                      </div>
                    )}

                    {/* Export Credits by Period - Compact */}
                    {uloResults.byPeriod && uloResults.byPeriod.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                          Credits by Period
                          <InfoTooltip 
                            content="Export credits are earned when your solar system produces more electricity than you use. Credits are valued at the rate for the time period when the export occurred (Off-Peak, Mid-Peak, On-Peak, or Ultra-Low Overnight)."
                            iconSize={14}
                          />
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {uloResults.byPeriod
                            .filter(p => p.kwhExported > 0 || p.exportCredits > 0)
                            .map((period) => (
                              <div key={period.period} className="bg-gray-50 rounded p-2 text-xs">
                                <div className="font-semibold text-gray-700 capitalize mb-1">
                                  {period.period.replace('-', ' ')}
                                </div>
                                <div className="text-emerald-700 font-bold">
                                  ${period.exportCredits.toFixed(0)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Warnings - Full Width */}
            {(touResults?.warnings?.length || uloResults?.warnings?.length) && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                    <ul className="space-y-1">
                      {[...(touResults?.warnings || []), ...(uloResults?.warnings || [])].map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-800">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Difference Summary */}
            {touResults && uloResults && uloResults.annual.exportCredits !== touResults.annual.exportCredits && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 text-center">
                  <strong>Difference:</strong> The {uloResults.annual.exportCredits > touResults.annual.exportCredits ? 'ULO' : 'TOU'} plan provides{' '}
                  <strong className="text-emerald-700">
                    ${Math.abs(uloResults.annual.exportCredits - touResults.annual.exportCredits).toFixed(2)}
                  </strong>{' '}
                  more in annual credits.
                </p>
              </div>
            )}
              </>
            )}

            {/* Distribution Editing Tab */}
            {activeTab === 'distribution' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-blue-700">
                      Customize how your annual usage is distributed across different rate periods. This will affect how much you export and import, and ultimately your net metering credits.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* TOU Distribution */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Sun className="text-blue-500" size={20} />
                      <h3 className="font-bold text-blue-600 text-lg">Time-of-Use (TOU)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">On-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.onPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, onPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Mid-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.midPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, midPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Off-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.offPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, offPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">
                          Total: {(
                            touDistribution.offPeakPercent +
                            touDistribution.midPeakPercent +
                            touDistribution.onPeakPercent
                          ).toFixed(1)}%
                        </span>
                        {Math.abs(touDistribution.offPeakPercent + touDistribution.midPeakPercent + touDistribution.onPeakPercent - 100) > 0.1 ? (
                          <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Valid</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ULO Distribution */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Moon className="text-purple-500" size={20} />
                      <h3 className="font-bold text-purple-600 text-lg">Ultra-Low Overnight (ULO)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">On-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.onPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, onPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Mid-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.midPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, midPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Off-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.offPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, offPeakPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Ultra-Low:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.ultraLowPercent || 0}
                            onChange={(e) => setUloDistribution({...uloDistribution, ultraLowPercent: Number(e.target.value)})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">
                          Total: {(
                            (uloDistribution.ultraLowPercent || 0) +
                            uloDistribution.offPeakPercent +
                            uloDistribution.midPeakPercent +
                            uloDistribution.onPeakPercent
                          ).toFixed(1)}%
                        </span>
                        {Math.abs((uloDistribution.ultraLowPercent || 0) + uloDistribution.offPeakPercent + uloDistribution.midPeakPercent + uloDistribution.onPeakPercent - 100) > 0.1 ? (
                          <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Valid</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    After adjusting your usage distribution, calculations will update automatically. Switch to "Detailed Analysis" to see monthly breakdowns.
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Analysis Tab */}
            {activeTab === 'detailed' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* TOU Detailed Breakdown */}
                  {touResults && (
                    <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                      <h3 className="text-xl font-bold text-blue-600 mb-4">TOU Detailed Breakdown</h3>
                      
                      {/* Monthly Breakdown */}
                      {touResults.monthly && touResults.monthly.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <BarChart3 size={16} />
                            Monthly Breakdown
                          </h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {touResults.monthly.map((month, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-semibold text-sm text-gray-700">
                                    {new Date(month.year, month.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </span>
                                  <span className={`text-sm font-bold ${month.netBill < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    ${month.netBill.toFixed(2)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Exported: </span>
                                    <span className="font-semibold">{month.totalExported.toFixed(0)} kWh</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Credits: </span>
                                    <span className="font-semibold text-emerald-600">${month.exportCredits.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Imported: </span>
                                    <span className="font-semibold">{month.totalImported.toFixed(0)} kWh</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Cost: </span>
                                    <span className="font-semibold">${month.importCost.toFixed(2)}</span>
                                  </div>
                                </div>
                                {month.creditRolloverAfterCap > 0 && (
                                  <div className="mt-2 text-xs text-blue-600">
                                    Credit Rollover: ${month.creditRolloverAfterCap.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Period Breakdown */}
                      {touResults.byPeriod && touResults.byPeriod.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Export Credits by Period</h4>
                          <div className="space-y-2">
                            {touResults.byPeriod.map((period) => (
                              <div key={period.period} className="flex justify-between items-center bg-gray-50 rounded p-3">
                                <span className="text-sm font-semibold text-gray-700 capitalize">
                                  {period.period.replace('-', ' ')}
                                </span>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-emerald-600">
                                    ${period.exportCredits.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {period.kwhExported.toFixed(0)} kWh
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ULO Detailed Breakdown */}
                  {uloResults && (
                    <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                      <h3 className="text-xl font-bold text-purple-600 mb-4">ULO Detailed Breakdown</h3>
                      
                      {/* Monthly Breakdown */}
                      {uloResults.monthly && uloResults.monthly.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <BarChart3 size={16} />
                            Monthly Breakdown
                          </h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {uloResults.monthly.map((month, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-semibold text-sm text-gray-700">
                                    {new Date(month.year, month.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </span>
                                  <span className={`text-sm font-bold ${month.netBill < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    ${month.netBill.toFixed(2)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Exported: </span>
                                    <span className="font-semibold">{month.totalExported.toFixed(0)} kWh</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Credits: </span>
                                    <span className="font-semibold text-emerald-600">${month.exportCredits.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Imported: </span>
                                    <span className="font-semibold">{month.totalImported.toFixed(0)} kWh</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Cost: </span>
                                    <span className="font-semibold">${month.importCost.toFixed(2)}</span>
                                  </div>
                                </div>
                                {month.creditRolloverAfterCap > 0 && (
                                  <div className="mt-2 text-xs text-blue-600">
                                    Credit Rollover: ${month.creditRolloverAfterCap.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Period Breakdown */}
                      {uloResults.byPeriod && uloResults.byPeriod.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Export Credits by Period</h4>
                          <div className="space-y-2">
                            {uloResults.byPeriod.map((period) => (
                              <div key={period.period} className="flex justify-between items-center bg-gray-50 rounded p-3">
                                <span className="text-sm font-semibold text-gray-700 capitalize">
                                  {period.period.replace('-', ' ')}
                                </span>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-emerald-600">
                                    ${period.exportCredits.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {period.kwhExported.toFixed(0)} kWh
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!touResults || !uloResults || loading}
            className="flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-lg font-semibold hover:bg-navy-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

