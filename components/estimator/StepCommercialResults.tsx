'use client'

// Commercial Step: Results Display

import { useMemo } from 'react'
import { ArrowRight, Download, Share2, CheckCircle, AlertTriangle } from 'lucide-react'
import { calculateCommercialResults, type CommercialResults } from '@/lib/commercial-calculator'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface StepCommercialResultsProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepCommercialResults({ data, onComplete, onBack }: StepCommercialResultsProps) {
  const results: CommercialResults | null = useMemo(() => {
    try {
      // Build inputs from data
      const inputs = {
        billingMethod: data.billingMethod || 'Per kW',
        demandRatePerUnit30d: data.demandRatePerUnit30d || 0,
        measuredPeakKVA: data.measuredPeakKVA || 0,
        currentPF: data.currentPF || 0.9,
        targetPF: data.targetPF || 0.95,
        targetCapKW: data.targetCapKW,
        shaveKW: data.shaveKW,
        peakDurationMin: data.peakDurationMin || 15,
        batteryCRate: data.batteryCRate || 0.5,
        roundTripEff: data.roundTripEff || 0.9,
        usableDOD: data.usableDOD || 0.9,
        installedCostTotal: data.installedCostTotal || 0,
        analysisYears: data.analysisYears || 25,
        annualEscalator: data.annualEscalator || 0.02,
        solarACElligibleKW: data.solarACElligibleKW || 0,
        rebateRatePerKW: data.rebateRatePerKW || 860,
        rebateCapDollar: data.rebateCapDollar || 860000,
        applySolar50Cap: data.applySolar50Cap || false,
        solarOnlyCost: data.solarOnlyCost,
      }

      return calculateCommercialResults(inputs)
    } catch (error) {
      console.error('Error calculating results:', error)
      return null
    }
  }, [data])

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-navy-500 mb-2">Calculation Error</h2>
          <p className="text-gray-600">Unable to calculate results. Please check your inputs.</p>
          <button onClick={onBack} className="btn-primary mt-6">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const billingStatesData = [
    {
      name: 'Before',
      kVA: results.before.kVA,
      kW: results.before.kW,
      billedDemand: results.before.billedDemand,
      monthlyCost: results.before.monthlyCost,
    },
    {
      name: 'After PF',
      kVA: results.afterPF.kVA,
      kW: results.afterPF.kW,
      billedDemand: results.afterPF.billedDemand,
      monthlyCost: results.afterPF.monthlyCost,
    },
    {
      name: 'After PF+Shave',
      kVA: results.afterPFShave.kVA,
      kW: results.afterPFShave.kW,
      billedDemand: results.afterPFShave.billedDemand,
      monthlyCost: results.afterPFShave.monthlyCost,
    },
  ]

  const savingsChartData = results.multiYearSavings.map((year, index) => ({
    year: `Year ${year.year}`,
    annual: year.annualSavings,
    cumulative: year.cumulative,
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Commercial Battery Savings Results
        </h1>
        <p className="text-gray-600">
          Review your demand charge savings and system recommendations
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(results.annualSavings)}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">ROI (Year 1)</div>
            <div className="text-2xl font-bold text-navy-500">
              {results.roiYear1.toFixed(1)}%
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Payback Period</div>
            <div className="text-2xl font-bold text-navy-500">
              {results.paybackYears === Infinity ? 'N/A' : `${results.paybackYears.toFixed(1)} years`}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600 mb-1">Net Cost</div>
            <div className="text-2xl font-bold text-navy-500">
              {formatCurrency(results.netInstalledCost)}
            </div>
          </div>
        </div>

        {/* Billing States Comparison */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4">Billing States Comparison</h2>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={billingStatesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="billedDemand" fill="#ef4444" name="Billed Demand (units)" />
                <Bar dataKey="monthlyCost" fill="#3b82f6" name="Monthly Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Before</div>
              <div className="space-y-1 text-sm">
                <div>kVA: {results.before.kVA.toFixed(1)}</div>
                <div>kW: {results.before.kW.toFixed(1)}</div>
                <div>Billed: {results.before.billedDemand.toFixed(1)}</div>
                <div className="font-semibold text-navy-500 mt-2">
                  Cost: {formatCurrency(results.before.monthlyCost)}/mo
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">After PF Only</div>
              <div className="space-y-1 text-sm">
                <div>kVA: {results.afterPF.kVA.toFixed(1)}</div>
                <div>kW: {results.afterPF.kW.toFixed(1)}</div>
                <div>Billed: {results.afterPF.billedDemand.toFixed(1)}</div>
                <div className="font-semibold text-navy-500 mt-2">
                  Cost: {formatCurrency(results.afterPF.monthlyCost)}/mo
                </div>
              </div>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-red-700 mb-2">After PF + Shave</div>
              <div className="space-y-1 text-sm">
                <div>kVA: {results.afterPFShave.kVA.toFixed(1)}</div>
                <div>kW: {results.afterPFShave.kW.toFixed(1)}</div>
                <div>Billed: {results.afterPFShave.billedDemand.toFixed(1)}</div>
                <div className="font-semibold text-green-600 mt-2">
                  Cost: {formatCurrency(results.afterPFShave.monthlyCost)}/mo
                </div>
                <div className="text-xs text-green-600 mt-2">
                  Savings: {formatCurrency(results.monthlySavings)}/mo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Sizing */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4">Recommended System</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery Capacity:</span>
                  <span className="font-semibold text-navy-500">{results.batteryKWh.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inverter Power:</span>
                  <span className="font-semibold text-navy-500">{results.inverterKW.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sizing Type:</span>
                  <span className={`font-semibold ${
                    results.sizingType === 'power-dominated' ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    {results.sizingType === 'power-dominated' 
                      ? 'Power-Dominated (Short Peak)' 
                      : 'Energy-Dominated (Long Peak)'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                {results.sizingType === 'power-dominated' ? (
                  <>
                    <strong>Power-Dominated:</strong> Your peak is short, so battery sizing is driven by
                    power requirements (C-rate). This typically provides better ROI.
                  </>
                ) : (
                  <>
                    <strong>Energy-Dominated:</strong> Your peak is long, requiring more energy capacity.
                    Consider load management or a smaller cap to improve ROI.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rebate Breakdown */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4">Rebate & Cost Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Installed Cost:</span>
              <span className="font-semibold">{formatCurrency(data.installedCostTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Rebate ({data.solarACElligibleKW} kW × ${data.rebateRatePerKW}/kW):</span>
              <span className="font-semibold">{formatCurrency(results.baseRebate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">After Cap (${data.rebateCapDollar.toLocaleString()}):</span>
              <span className="font-semibold">{formatCurrency(results.rebateAfterCap)}</span>
            </div>
            {data.applySolar50Cap && (
              <div className="flex justify-between">
                <span className="text-gray-600">50% Solar Cap:</span>
                <span className="font-semibold">{formatCurrency(0.5 * (data.solarOnlyCost || 0))}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-semibold text-navy-500">Final Rebate:</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(results.rebateFinal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-semibold text-navy-500">Net Installed Cost:</span>
              <span className="font-bold text-navy-500 text-lg">{formatCurrency(results.netInstalledCost)}</span>
            </div>
          </div>
        </div>

        {/* Multi-Year Savings */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-navy-500 mb-4">
            {data.analysisYears}-Year Savings Projection
          </h2>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="annual" fill="#10b981" name="Annual Savings" />
                <Bar dataKey="cumulative" fill="#3b82f6" name="Cumulative Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-gray-600">
            * Savings escalate at {((data.annualEscalator || 0.02) * 100).toFixed(1)}% annually
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card p-6">
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary flex items-center gap-2">
              <Download size={20} />
              Download PDF
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Share2 size={20} />
              Share Results
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Back
          </button>
          <button
            onClick={() => onComplete({ commercialResults: results })}
            className="btn-primary flex items-center gap-2"
          >
            Continue to Contact
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

