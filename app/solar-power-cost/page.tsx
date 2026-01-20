'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DollarSign, TrendingUp, Home, Calculator as CalculatorIcon } from 'lucide-react'
import Link from 'next/link'

export default function SolarPowerCostPage() {
  const costFactors = [
    {
      title: 'System Size',
      description: 'Larger systems cost more upfront but provide better long-term savings. Typical residential systems range from 5kW to 15kW.',
      impact: 'High',
    },
    {
      title: 'Panel Quality',
      description: 'Premium panels with higher efficiency cost more but generate more electricity per square foot.',
      impact: 'Medium',
    },
    {
      title: 'Installation Complexity',
      description: 'Roof type, accessibility, and electrical panel upgrades can affect installation costs.',
      impact: 'Medium',
    },
    {
      title: 'Location',
      description: 'Provincial labor costs, permit fees, and local regulations vary across Canada.',
      impact: 'Low',
    },
    {
      title: 'Battery Storage',
      description: 'Adding battery storage increases costs but provides backup power and peak shaving benefits.',
      impact: 'High',
    },
    {
      title: 'Incentives & Rebates',
      description: 'Available rebates can reduce your net cost by thousands of dollars.',
      impact: 'High',
    },
  ]

  const averageCosts = [
    { province: 'Ontario', avgCostPerWatt: '$2.50 - $3.50', avgSystemCost: '$12,500 - $35,000' },
    { province: 'Alberta', avgCostPerWatt: '$2.75 - $3.75', avgSystemCost: '$13,750 - $37,500' },
    { province: 'British Columbia', avgCostPerWatt: '$2.50 - $3.50', avgSystemCost: '$12,500 - $35,000' },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Solar Power Cost in Canada
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Understand the costs of going solar and what factors affect your investment
          </p>
        </div>
      </section>

      {/* Cost Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-lg mb-6">Understanding Solar Costs</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                The cost of a solar installation depends on several factors, including system size, equipment quality, installation complexity, and available incentives. Understanding these factors helps you make an informed decision.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Most Canadian homeowners invest between $12,000 and $40,000 for a residential solar system, with the average system paying for itself in 6-10 years through electricity savings.
              </p>
              <div className="bg-forest-50 rounded-lg p-6 border-l-4 border-forest-500">
                <div className="flex items-start gap-3">
                  <CalculatorIcon className="text-forest-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-gray-700 text-sm">
                    <strong>Get a personalized estimate:</strong> Our free calculator provides a detailed cost breakdown based on your specific home and energy needs.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-forest-50 to-sky-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-forest-500 mb-6">Average Costs by Province</h3>
              <div className="space-y-4">
                {averageCosts.map((province, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-forest-500">{province.province}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Cost per watt: {province.avgCostPerWatt}</p>
                      <p>Typical 10kW system: {province.avgSystemCost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Factors Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Factors Affecting Solar Costs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Understanding what influences your solar investment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {costFactors.map((factor, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-forest-500/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-forest-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500">{factor.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      factor.impact === 'High' ? 'bg-red-100 text-red-700' :
                      factor.impact === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {factor.impact} Impact
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Breakdown Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Typical Cost Breakdown</h2>
            <p className="text-lg text-gray-600">
              How your solar investment is allocated
            </p>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-forest-50 rounded-2xl p-8 md:p-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Home className="text-forest-500" size={24} />
                  <span className="font-semibold text-gray-800">Solar Panels & Equipment</span>
                </div>
                <span className="font-bold text-forest-500">50-60%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-maple-500" size={24} />
                  <span className="font-semibold text-gray-800">Installation & Labor</span>
                </div>
                <span className="font-bold text-maple-500">20-30%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-sky-500" size={24} />
                  <span className="font-semibold text-gray-800">Permits & Interconnection</span>
                </div>
                <span className="font-bold text-sky-500">5-10%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <CalculatorIcon className="text-amber-500" size={24} />
                  <span className="font-semibold text-gray-800">Inverter & Balance of System</span>
                </div>
                <span className="font-bold text-amber-500">10-15%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="heading-lg mb-4">Return on Investment</h2>
              <p className="text-lg text-gray-600">
                Solar systems typically pay for themselves in 6-10 years
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-forest-50 rounded-lg">
                <div className="text-3xl font-bold text-forest-500 mb-2">6-10</div>
                <div className="text-gray-600 text-sm">Years to Payback</div>
              </div>
              <div className="text-center p-6 bg-maple-50 rounded-lg">
                <div className="text-3xl font-bold text-maple-500 mb-2">20-30</div>
                <div className="text-gray-600 text-sm">Years System Lifespan</div>
              </div>
              <div className="text-center p-6 bg-sky-50 rounded-lg">
                <div className="text-3xl font-bold text-sky-500 mb-2">$50K+</div>
                <div className="text-gray-600 text-sm">Lifetime Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Get Your Personalized Cost Estimate</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our free calculator provides a detailed cost breakdown based on your home, location, and energy needs
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Calculate Your Solar Costs
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
