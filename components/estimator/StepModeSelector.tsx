'use client'

// Step 0: Mode Selection - Easy vs Detailed

import { Zap, BarChart3, ArrowRight } from 'lucide-react'

interface StepModeSelectorProps {
  onComplete: (data: any) => void
}

export function StepModeSelector({ onComplete }: StepModeSelectorProps) {
  const handleModeSelect = (mode: 'easy' | 'detailed') => {
    onComplete({ estimatorMode: mode })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy-500 mb-4">
          Get Your Solar Estimate
        </h1>
        <p className="text-xl text-gray-600">
          Choose the best option for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Estimate - Easy Mode */}
        <div 
          onClick={() => handleModeSelect('easy')}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-500 group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="text-white" size={32} />
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              RECOMMENDED
            </span>
          </div>

          <h2 className="text-2xl font-bold text-navy-500 mb-3">
            Quick Estimate
          </h2>
          
          <p className="text-gray-600 mb-6">
            Get a ballpark estimate in minutes with minimal information
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">3-5 minutes to complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Basic property info only</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Instant cost estimate</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Perfect for browsing</span>
            </div>
          </div>

          <button className="btn-primary w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start Quick Estimate
            <ArrowRight size={20} />
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            You can upgrade to detailed later
          </p>
        </div>

        {/* Detailed Analysis - Hard Mode */}
        <div 
          onClick={() => handleModeSelect('detailed')}
          className="card p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-navy-500 group"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="text-white" size={32} />
            </div>
            <span className="px-3 py-1 bg-navy-100 text-navy-600 text-xs font-bold rounded-full">
              MOST ACCURATE
            </span>
          </div>

          <h2 className="text-2xl font-bold text-navy-500 mb-3">
            Detailed Analysis
          </h2>
          
          <p className="text-gray-600 mb-6">
            Get a comprehensive, accurate quote with custom specifications
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">10-15 minutes to complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Roof drawing & measurements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Custom appliance analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Professional quote ready</span>
            </div>
          </div>

          <button className="bg-navy-500 hover:bg-navy-600 text-white font-semibold py-3 px-6 rounded-lg transition-all w-full group-hover:shadow-lg flex items-center justify-center gap-2">
            Start Detailed Analysis
            <ArrowRight size={20} />
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Best for serious buyers
          </p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-12 card p-6">
        <h3 className="font-bold text-navy-500 mb-4 text-center">Quick Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-semibold">Feature</th>
                <th className="text-center py-2 text-red-600 font-semibold">Quick</th>
                <th className="text-center py-2 text-navy-600 font-semibold">Detailed</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="py-3">Time Required</td>
                <td className="text-center text-red-600 font-semibold">3-5 min</td>
                <td className="text-center text-navy-600">10-15 min</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Roof Drawing</td>
                <td className="text-center">Simple size selection</td>
                <td className="text-center">Precise map tracing</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Energy Analysis</td>
                <td className="text-center">Monthly bill only</td>
                <td className="text-center">Appliance-by-appliance</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Photos</td>
                <td className="text-center">Optional (2-3)</td>
                <td className="text-center">Organized (up to 17)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3">Accuracy</td>
                <td className="text-center">±15-20%</td>
                <td className="text-center">±5-10%</td>
              </tr>
              <tr>
                <td className="py-3">Best For</td>
                <td className="text-center">Browsing, initial research</td>
                <td className="text-center">Serious buyers, accurate quote</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

