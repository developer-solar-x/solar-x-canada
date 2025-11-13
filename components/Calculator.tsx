'use client'

// Interactive savings calculator component

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, Zap, TrendingUp } from 'lucide-react'
import { calculateQuickEstimate, formatCurrency, formatKw } from '@/lib/utils'
import CountUp from 'react-countup'

export function Calculator() {
  // Monthly bill input state
  const [monthlyBill, setMonthlyBill] = useState(150)
  
  // Calculate estimates based on current bill amount
  const estimate = calculateQuickEstimate(monthlyBill)

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Decorative pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #1B4E7C 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">How Much Could You Save?</h2>
          <p className="text-lg text-gray-600">
            Get an instant estimate based on your electricity bill
          </p>
        </div>

        {/* Calculator card */}
        <div className="card bg-white shadow-xl p-8 md:p-12">
          {/* Input section */}
          <div className="mb-12">
            <label className="block text-lg font-semibold text-navy-500 mb-4">
              Your Monthly Electricity Bill
            </label>
            
            {/* Slider with value display */}
            <div className="relative pt-8">
              {/* Current value display */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-2xl shadow-lg">
                  {formatCurrency(monthlyBill)}
                </div>
              </div>

              {/* Slider input */}
              <label htmlFor="monthly-bill-slider" className="sr-only">
                Monthly electricity bill amount
              </label>
              <input
                id="monthly-bill-slider"
                type="range"
                min="50"
                max="500"
                step="10"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                aria-label="Monthly electricity bill amount"
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #DC143C 0%, #DC143C ${((monthlyBill - 50) / 450) * 100}%, #E2E8F0 ${((monthlyBill - 50) / 450) * 100}%, #E2E8F0 100%)`
                }}
              />

              {/* Min/max labels */}
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>$50</span>
                <span>$500</span>
              </div>
            </div>
          </div>

          {/* Output section - 3 metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Annual Savings */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200">
              <div className="flex justify-center mb-3">
                <DollarSign className="text-green-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                <CountUp
                  end={estimate.annualSavings}
                  duration={0.5}
                  prefix="$"
                  separator=","
                />
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Estimated Annual Savings
              </div>
            </div>

            {/* System Size */}
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200">
              <div className="flex justify-center mb-3">
                <Zap className="text-red-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                <CountUp
                  end={estimate.systemSize}
                  duration={0.5}
                  decimals={1}
                  suffix=" kW"
                />
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Recommended System Size
              </div>
            </div>

            {/* Payback Period */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200">
              <div className="flex justify-center mb-3">
                <TrendingUp className="text-blue-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <CountUp
                  end={estimate.paybackYears}
                  duration={0.5}
                  decimals={1}
                  suffix=" years"
                />
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Return on Investment
              </div>
            </div>
          </div>

          {/* CTA button */}
          <div className="text-center">
            <Link
              href="/estimator"
              className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
            >
              Get Detailed Estimate
            </Link>
          </div>
        </div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #DC143C;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(220, 20, 60, 0.4);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #DC143C;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(220, 20, 60, 0.4);
        }
      `}</style>
    </section>
  )
}

