'use client'

import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface ElectricityBillInflationCalculatorProps {
  monthlyBill?: number
}

export function ElectricityBillInflationCalculator({ monthlyBill }: ElectricityBillInflationCalculatorProps) {
  const [annualIncreaseInput, setAnnualIncreaseInput] = useState<string>('4.5')

  // Use monthlyBill prop directly, require it to be provided
  if (!monthlyBill || monthlyBill <= 0) {
    return null
  }

  // Convert input to number, default to 4.5 if invalid
  const annualIncrease = useMemo(() => {
    const num = parseFloat(annualIncreaseInput)
    return isNaN(num) || num < 0 ? 4.5 : Math.min(20, num)
  }, [annualIncreaseInput])

  // Calculate 25-year projection
  const projectionData = useMemo(() => {
    const data = []
    let currentBill = monthlyBill
    let totalCost = 0

    for (let year = 0; year <= 25; year++) {
      const monthlyCost = currentBill
      const annualCost = monthlyCost * 12
      totalCost += annualCost

      // Show labels at year 0, 5, 10, 15, 20, 25
      const yearLabel = year === 0 ? 'Now' : year === 25 ? '25' : year % 5 === 0 ? year.toString() : ''

      data.push({
        year: year,
        yearLabel: yearLabel,
        monthlyPayment: Math.round(monthlyCost * 100) / 100,
        cumulativeCost: Math.round(totalCost)
      })

      // Apply annual increase for next year (don't apply after year 25)
      if (year < 25) {
        currentBill = currentBill * (1 + annualIncrease / 100)
      }
    }

    return { data, totalCost: Math.round(totalCost), finalMonthlyBill: Math.round(currentBill * 100) / 100 }
  }, [monthlyBill, annualIncrease])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-navy-500 mb-2">Electricity Bill Inflation Calculator</h3>
        <p className="text-gray-600 text-sm">
          See how your electricity costs will increase over 25 years
        </p>
      </div>

      {/* Annual Increase Input */}
      <div className="mb-6 max-w-md mx-auto">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Estimated annual increase
          <div className="relative inline-block ml-2 group">
            <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={16} />
            <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
              Historical average is 3-5% per year. Adjust based on your region.
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </label>
        <div className="relative">
          <input
            type="number"
            value={annualIncreaseInput}
            onChange={(e) => {
              const value = e.target.value
              // Allow empty string, single decimal point, or valid numbers
              if (value === '' || value === '.' || /^\d*\.?\d*$/.test(value)) {
                setAnnualIncreaseInput(value)
              }
            }}
            onBlur={(e) => {
              const value = e.target.value
              const numValue = parseFloat(value)
              // Reset to default if empty or invalid
              if (value === '' || isNaN(numValue) || numValue < 0) {
                setAnnualIncreaseInput('4.5')
              } else if (numValue > 20) {
                setAnnualIncreaseInput('20')
              }
            }}
            className="w-full pl-4 pr-8 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            placeholder="4.5"
            min="0"
            max="20"
            step="0.1"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">CURRENT MONTHLY ELECTRICITY PAYMENT</div>
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(monthlyBill)}</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">FUTURE MONTHLY ELECTRICITY PAYMENT</div>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(projectionData.finalMonthlyBill)}</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">25 YEAR TOTAL COST</div>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(projectionData.totalCost)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-4">
          <div className="text-center mb-2">
            <h4 className="text-lg font-bold text-red-600">
              25 Year Cost of Doing Nothing is {formatCurrency(projectionData.totalCost)}
            </h4>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData.data}>
                <defs>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const item = projectionData.data.find(d => d.year === value)
                    return item?.yearLabel || ''
                  }}
                  label={{ value: 'YEARS', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: 11, fontWeight: 'bold' } }}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${Math.round(value)}`}
                  domain={[0, 'dataMax + 50']}
                  label={{ value: 'MONTHLY PAYMENT ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11, fontWeight: 'bold' } }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="monthlyPayment"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPayment)"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
          <p>
            Based on {annualIncrease}% annual increase, your monthly bill will grow from {formatCurrency(monthlyBill)} to {formatCurrency(projectionData.finalMonthlyBill)} over 25 years.
          </p>
        </div>
      </div>
    </div>
  )
}

