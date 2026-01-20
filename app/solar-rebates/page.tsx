'use client'

import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DollarSign, MapPin, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'

export default function SolarRebatesPage() {
  const provinces = [
    {
      name: 'Ontario',
      code: 'ON',
      rebates: [
        {
          type: 'Solar',
          amount: '$100 per kW',
          max: '$5,000',
          description: 'Zero-export solar systems',
        },
        {
          type: 'Battery',
          amount: '$300 per kWh',
          max: '$5,000',
          description: 'Battery storage systems',
        },
      ],
    },
    {
      name: 'Alberta',
      code: 'AB',
      rebates: [
        {
          type: 'Solar',
          amount: 'Varies',
          max: 'Check local programs',
          description: 'Provincial and municipal programs available',
        },
      ],
    },
    {
      name: 'British Columbia',
      code: 'BC',
      rebates: [
        {
          type: 'Solar',
          amount: 'Varies',
          max: 'Check local programs',
          description: 'Provincial and municipal programs available',
        },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Solar Rebates in Canada
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Discover available rebates and incentives for solar installations across Canada
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-lg mb-6">Understanding Solar Rebates</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Solar rebates are financial incentives offered by federal, provincial, and municipal governments to encourage homeowners to install solar energy systems. These rebates can significantly reduce the upfront cost of going solar.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Rebates vary by province and can change over time. It's important to check current programs in your area and understand eligibility requirements before making your solar investment.
              </p>
              <div className="bg-sky-50 rounded-lg p-6 border-l-4 border-sky-500">
                <div className="flex items-start gap-3">
                  <Info className="text-sky-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-gray-700 text-sm">
                    <strong>Note:</strong> Our calculator automatically accounts for available rebates in your province when generating your solar estimate.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-forest-50 to-sky-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500 mb-2">Reduce Upfront Costs</h3>
                    <p className="text-gray-600 text-sm">
                      Rebates can reduce your initial investment by thousands of dollars
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-maple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-maple-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-maple-500 mb-2">Faster Payback</h3>
                    <p className="text-gray-600 text-sm">
                      Lower upfront costs mean faster return on investment
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-sky-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-500 mb-2">Province-Specific</h3>
                    <p className="text-gray-600 text-sm">
                      Each province has different programs and eligibility requirements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provincial Rebates Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Provincial Rebate Programs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Current rebate information by province
            </p>
          </div>

          <div className="space-y-8">
            {provinces.map((province, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-bold text-forest-500 mb-6">
                  {province.name} ({province.code})
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {province.rebates.map((rebate, rebateIndex) => (
                    <div
                      key={rebateIndex}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-forest-500/10 rounded-lg flex items-center justify-center">
                          <DollarSign className="text-forest-500" size={20} />
                        </div>
                        <h4 className="font-bold text-forest-500">{rebate.type} Rebate</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-700">
                          <span className="font-semibold">Amount:</span> {rebate.amount}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Maximum:</span> {rebate.max}
                        </p>
                        <p className="text-gray-600 text-sm mt-3">{rebate.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <p className="text-gray-700 text-sm">
              <strong>Important:</strong> Rebate programs change frequently. Always verify current eligibility and amounts with your provincial energy authority or a qualified installer before making your purchase decision.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Calculator CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Calculate Your Rebate Savings</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Use our free calculator to see how rebates affect your solar investment and payback period
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Get Your Solar Estimate
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
