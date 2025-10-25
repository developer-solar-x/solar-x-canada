'use client'

// Step 4: Review estimate and results

import { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingUp, TrendingDown, PiggyBank, Loader2, Leaf } from 'lucide-react'
import { formatCurrency, formatKw, formatNumber } from '@/lib/utils'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface StepReviewProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepReview({ data, onComplete, onBack }: StepReviewProps) {
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'savings' | 'production' | 'environmental'>('savings')

  // Fetch estimate from API
  useEffect(() => {
    async function fetchEstimate() {
      try {
        const response = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate estimate')
        }

        const result = await response.json()
        setEstimate(result.data)
      } catch (error) {
        console.error('Estimate error:', error)
        // Use fallback estimate for demo
        setEstimate({
          system: { sizeKw: 8.5, numPanels: 28 },
          costs: { totalCost: 21250, netCost: 16250, incentives: 5000 },
          savings: { annualSavings: 2160, monthlySavings: 180, paybackYears: 7.5, roi: 265 },
          production: { annualKwh: 10200, monthlyKwh: Array(12).fill(850) },
          environmental: { co2OffsetTonsPerYear: 4.5, treesEquivalent: 108, carsOffRoadEquivalent: 0.9 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEstimate()
  }, [data])

  if (loading || !estimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-red-500 mb-4" size={48} />
        <p className="text-lg text-gray-600">Calculating your solar potential...</p>
        <p className="text-sm text-gray-500 mt-2">Analyzing roof dimensions, weather data, and energy usage</p>
      </div>
    )
  }

  // Prepare chart data
  const savingsChartData = Array.from({ length: 25 }, (_, i) => ({
    year: i + 1,
    savings: Math.round(estimate.savings.annualSavings * (i + 1) * 1.03),
  }))

  const productionChartData = estimate.production.monthlyKwh.map((kwh: number, i: number) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    production: kwh,
  }))

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
      {/* Left sidebar - Summary */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-navy-500 mb-4">Your Solar Estimate</h2>

        {/* Property summary card */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Property</h3>
          <p className="text-sm text-gray-600">{data.address}</p>
          <button
            onClick={() => onBack && onBack()}
            className="text-xs text-red-500 hover:underline mt-2"
          >
            Edit
          </button>
        </div>

        {/* Map snapshot card */}
        {data.mapSnapshot && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Your Roof</h3>
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={data.mapSnapshot} 
                alt="Roof drawing on satellite map" 
                className="w-full h-auto"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-navy-500">
                Satellite View
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Your traced roof outline
            </p>
          </div>
        )}

        {/* Roof summary card */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Roof Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Area: {data.roofAreaSqft?.toLocaleString()} sq ft</p>
            <p>Type: {data.roofType || 'Asphalt Shingle'}</p>
            <p>Pitch: {data.roofPitch || 'Medium'}</p>
          </div>
        </div>

        {/* Photos summary card */}
        {data.photos && data.photos.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Property Photos</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total Photos: {data.photos.length}</p>
              {data.photoSummary?.byCategory?.map((cat: any) => (
                cat.count > 0 && (
                  <p key={cat.category} className="text-xs capitalize">
                    {cat.category}: {cat.count}
                  </p>
                )
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              {data.photos.slice(0, 6).map((photo: any, idx: number) => (
                <div key={idx} className="aspect-square relative rounded overflow-hidden border border-gray-200">
                  <img 
                    src={photo.preview} 
                    alt={`Property ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {data.photos.length > 6 && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                +{data.photos.length - 6} more photos
              </p>
            )}
          </div>
        )}

        {/* Energy summary card */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Energy Usage</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {data.energyUsage && (
              <>
                <p>Daily: {data.energyUsage.dailyKwh} kWh</p>
                <p>Monthly: {data.energyUsage.monthlyKwh.toLocaleString()} kWh</p>
                <p>Annual: {data.energyUsage.annualKwh.toLocaleString()} kWh</p>
              </>
            )}
            <p className="pt-2 border-t border-gray-200 mt-2">Monthly Bill: {formatCurrency(parseFloat(data.monthlyBill || '0'))}</p>
            {data.appliances && data.appliances.length > 0 && (
              <p>Active Appliances: {data.appliances.length}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Results */}
      <div className="space-y-6">
        {/* Results header card */}
        <div className="card bg-gradient-to-r from-navy-500 to-blue-500 text-white p-6">
          <h2 className="text-2xl font-bold mb-1">Your Solar Estimate</h2>
          <p className="text-white/90">{data.address}</p>
        </div>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Size */}
          <div className="card p-6">
            <Zap className="text-red-500 mb-3" size={32} />
            <div className="text-3xl font-bold text-navy-500 mb-1">
              {formatKw(estimate.system.sizeKw)}
            </div>
            <div className="text-sm text-gray-600">Recommended System</div>
            <div className="text-xs text-gray-500 mt-1">~{estimate.system.numPanels} panels</div>
          </div>

          {/* Total Cost */}
          <div className="card p-6">
            <DollarSign className="text-navy-500 mb-3" size={32} />
            <div className="text-3xl font-bold text-navy-500 mb-1">
              {formatCurrency(estimate.costs.totalCost)}
            </div>
            <div className="text-sm text-gray-600">Estimated Cost</div>
            <div className="text-xs text-gray-500 mt-1">Before incentives</div>
          </div>

          {/* Net Cost */}
          <div className="card p-6">
            <TrendingDown className="text-green-600 mb-3" size={32} />
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(estimate.costs.netCost)}
            </div>
            <div className="text-sm text-gray-600">Your Net Cost</div>
            <div className="text-xs text-gray-500 mt-1">With {formatCurrency(estimate.costs.incentives)} incentives</div>
          </div>

          {/* Monthly Savings */}
          <div className="card p-6">
            <PiggyBank className="text-blue-600 mb-3" size={32} />
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatCurrency(estimate.savings.monthlySavings)}
            </div>
            <div className="text-sm text-gray-600">Monthly Savings</div>
            <div className="text-xs text-gray-500 mt-1">Based on current rates</div>
          </div>
        </div>

        {/* Tabs for detailed results */}
        <div className="card p-6">
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('savings')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'savings'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Savings
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'production'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveTab('environmental')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'environmental'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Environmental
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
                  <div className="text-xl font-bold text-navy-500">
                    {formatCurrency(estimate.savings.annualSavings)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">25-Year Savings</div>
                  <div className="text-xl font-bold text-navy-500">
                    {formatCurrency(estimate.savings.annualSavings * 25)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Payback Period</div>
                  <div className="text-xl font-bold text-navy-500">
                    {estimate.savings.paybackYears} years
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">ROI</div>
                  <div className="text-xl font-bold text-navy-500">
                    {estimate.savings.roi}%
                  </div>
                </div>
              </div>

              {/* Savings chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" children={
                  <BarChart data={savingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="savings" fill="#DC143C" />
                  </BarChart>
                } />
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Annual Production</div>
                  <div className="text-xl font-bold text-navy-500">
                    {formatNumber(estimate.production.annualKwh)} kWh
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Daily Average</div>
                  <div className="text-xl font-bold text-navy-500">
                    {Math.round(estimate.production.annualKwh / 365)} kWh
                  </div>
                </div>
              </div>

              {/* Production chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" children={
                  <LineChart data={productionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="production" stroke="#1B4E7C" strokeWidth={2} />
                  </LineChart>
                } />
              </div>
            </div>
          )}

          {activeTab === 'environmental' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Leaf className="text-green-600 flex-shrink-0" size={40} />
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.co2OffsetTonsPerYear} tons
                    </div>
                    <div className="text-sm text-gray-600">CO₂ offset per year</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">🌲</span>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.treesEquivalent}
                    </div>
                    <div className="text-sm text-gray-600">Trees planted equivalent</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">🚗</span>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.carsOffRoadEquivalent}
                    </div>
                    <div className="text-sm text-gray-600">Cars off road equivalent</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">♻️</span>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Supports renewable energy grid</div>
                    <div className="text-xs text-gray-500">Contributes to Ontario's clean energy goals</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-outline border-gray-300 text-gray-700 flex-1"
            >
              Back
            </button>
          )}
          <button
            onClick={() => onComplete({ estimate })}
            className="btn-primary flex-1"
          >
            Continue to Contact Form
          </button>
        </div>
      </div>
    </div>
  )
}

