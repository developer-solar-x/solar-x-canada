'use client'

// Step 4: Review estimate and results

import { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingUp, TrendingDown, PiggyBank, Loader2, Leaf, CreditCard } from 'lucide-react'
import { formatCurrency, formatKw, formatNumber } from '@/lib/utils'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FINANCING_OPTIONS, calculateFinancing } from '@/config/provinces'
import { calculateRoofAzimuth, getDirectionLabel, getOrientationEfficiency } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'

interface StepReviewProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

export function StepReview({ data, onComplete, onBack }: StepReviewProps) {
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'savings' | 'production' | 'environmental'>('savings')
  const [selectedFinancing, setSelectedFinancing] = useState<string>(data.financingOption || 'cash')

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
            <p>Total Area: {data.roofAreaSqft?.toLocaleString()} sq ft</p>
            
            {/* Show section count if multiple polygons */}
            {data.roofPolygon?.features && data.roofPolygon.features.length > 1 && (
              <p className="text-blue-600 font-medium">
                {data.roofPolygon.features.length} roof sections
              </p>
            )}
            
            <p>Type: {data.roofType || 'Asphalt Shingle'}</p>
            <p>Pitch: {data.roofPitch || 'Medium'}</p>
            {data.shadingLevel && (
              <p>Shading: {data.shadingLevel.charAt(0).toUpperCase() + data.shadingLevel.slice(1)}</p>
            )}
          </div>
          
          {/* Multi-section breakdown */}
          {data.roofPolygon?.features && data.roofPolygon.features.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Section Details</p>
              <div className="space-y-1">
                {data.roofPolygon.features.map((feature: any, index: number) => {
                  if (feature.geometry.type !== 'Polygon') return null
                  
                  const areaMeters = turf.area(feature)
                  const areaSqFt = Math.round(areaMeters * 10.764)
                  const azimuth = calculateRoofAzimuth(feature)
                  const direction = getDirectionLabel(azimuth)
                  const efficiency = getOrientationEfficiency(azimuth)
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-600">
                        Section {index + 1}: {direction} ({efficiency}%)
                      </span>
                      <span className="font-medium text-navy-500">
                        {areaSqFt.toLocaleString()} sq ft
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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

        {/* Add-ons summary (if any selected) */}
        {data.selectedAddOns && data.selectedAddOns.length > 0 && (
          <div className="card bg-blue-50 border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>Selected Add-ons</span>
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                {data.selectedAddOns.length}
              </span>
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {data.selectedAddOns.map((addOnId: string) => (
                <li key={addOnId} className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  <span className="capitalize">{addOnId.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              +${data.addOnsCost?.toLocaleString()} estimated additional cost
            </p>
          </div>
        )}

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

        {/* Financing Options */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                <CreditCard size={24} className="text-red-500" />
                Financing Options
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Choose how you'd like to pay for your solar system
              </p>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
              EXAMPLE RATES
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Note:</span> These are example financing rates for illustration purposes only.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {FINANCING_OPTIONS.map((option) => {
              const totalCost = (estimate.costs.netCost || 0) + (data.addOnsCost || 0)
              const financing = calculateFinancing(
                totalCost,
                option.interestRate,
                option.termYears
              )
              const isSelected = selectedFinancing === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedFinancing(option.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-navy-500 mb-1">
                    {option.name}
                  </div>
                  {option.termYears > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-red-500 mb-1">
                        ${financing.monthlyPayment}/mo
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {option.interestRate}% APR • {option.termYears} years
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: ${financing.totalPaid.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${totalCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        One-time payment
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
                        Best long-term value
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Selected financing details */}
          {selectedFinancing !== 'cash' && (() => {
            const selectedOption = FINANCING_OPTIONS.find(opt => opt.id === selectedFinancing)
            if (!selectedOption) return null
            
            const totalCost = (estimate.costs.netCost || 0) + (data.addOnsCost || 0)
            const financing = calculateFinancing(
              totalCost,
              selectedOption.interestRate,
              selectedOption.termYears
            )
            
            return (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {selectedOption.name} Breakdown
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Monthly Payment</p>
                    <p className="font-bold text-navy-500">
                      ${financing.monthlyPayment.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Interest</p>
                    <p className="font-bold text-orange-600">
                      ${financing.totalInterest.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Cost</p>
                    <p className="font-bold text-navy-500">
                      ${financing.totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {selectedOption.description}
                </p>
              </div>
            )
          })()}
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
            onClick={() => onComplete({ 
              estimate,
              financingOption: selectedFinancing
            })}
            className="btn-primary flex-1"
          >
            Continue to Contact Form
          </button>
        </div>
      </div>
    </div>
  )
}

