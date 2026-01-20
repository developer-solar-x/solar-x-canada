'use client'

import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DollarSign, MapPin, CheckCircle, Info, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export default function SolarRebatesPage() {
  const provinces = [
    {
      name: 'Ontario',
      code: 'ON',
      description: 'The ULO Opportunity',
      content: `Ontario's pricing has shifted toward rewarding smart storage. The Ultra-Low Overnight (ULO) rate structure offers exceptional savings potential with peak rates reaching 39.1¢/kWh—more than double the 2016 baseline.`,
      highlights: [
        {
          title: 'Rate Advantage',
          value: '39.1¢/kWh Peak',
          detail: 'Charge at 3¢/kWh overnight, discharge at peak hours'
        },
        {
          title: 'Home Renovation Savings (HRS)',
          value: 'Up to $10,000',
          detail: '$5,000 solar + $5,000 battery for load displacement systems'
        },
        {
          title: 'Business Tax Credit',
          value: '55% First-Year Write-off',
          detail: '30% Clean Tech ITC + accelerated depreciation'
        },
        {
          title: 'Commercial HRS',
          value: 'Up to $860,000',
          detail: 'Load displacement systems only'
        }
      ],
    },
    {
      name: 'Alberta',
      code: 'AB',
      description: 'The Solar Club™ & Complete City Directory',
      content: `Alberta is Canada's solar powerhouse, boasting 2,300 to 2,600 sunlight hours per year. The Solar Club™ allows members to switch between high-export rates in summer and low-import rates in winter.`,
      highlights: [
        {
          title: 'The Solar Club™',
          value: '30¢/kWh Export',
          detail: 'Summer rate for surplus energy; ~8¢/kWh winter import rate'
        },
        {
          title: 'Business ITC',
          value: '55% First-Year Write-off',
          detail: '30% Clean Tech ITC + accelerated depreciation'
        },
        {
          title: 'Municipal CEIP',
          value: 'Varies by City',
          detail: 'Financing attached to property tax, not personal loan'
        }
      ],
    },
    {
      name: 'Saskatchewan',
      code: 'SK',
      description: 'Hedging Against Hikes',
      content: `Electricity costs roughly 15¢/kWh with credits for selling back at 7.5¢/kWh. Direct self-consumption is key to maximum savings with battery backup options.`,
      highlights: [
        {
          title: 'Self-Consumption Focus',
          value: '7.5¢/kWh Credit',
          detail: '15¢/kWh retail rate vs. export credit'
        },
        {
          title: 'Business ITC',
          value: '55% First-Year Write-off',
          detail: '30% Clean Tech ITC + accelerated depreciation'
        },
        {
          title: 'Battery Rebate',
          value: '50% Off Smart Battery',
          detail: 'With SOLAR X - keep essential systems running during outages'
        }
      ],
    },
    {
      name: 'Nova Scotia',
      code: 'NS',
      description: 'Energy Security & Business Credits',
      content: `Rates are approximately 18.5¢/kWh and rising annually. Solar stops these increases while providing energy security and significant business incentives.`,
      highlights: [
        {
          title: 'Current Rate',
          value: '18.5¢/kWh',
          detail: 'Rising annually - solar locks in savings'
        },
        {
          title: 'Business Rebate',
          value: 'Up to $30,000',
          detail: '~25¢ per kWh of yearly production (Efficiency Nova Scotia)'
        },
        {
          title: 'Combined ITC',
          value: '55%+ Total Benefit',
          detail: '30% ITC + business rebate for rapid payback'
        },
        {
          title: 'AI Battery',
          value: 'Smart Dispatch',
          detail: 'Learns usage patterns to discharge during peak hours'
        }
      ],
    },
    {
      name: 'New Brunswick',
      code: 'NB',
      description: 'The Retrofit Powerhouse',
      content: `Electricity is ~15¢/kWh and climbing. Comprehensive retrofit programs and commercial incentives make New Brunswick a top choice for both residential and business solar.`,
      highlights: [
        {
          title: 'Home Rebate',
          value: 'Up to $3,000',
          detail: '$200/kW with Save Energy NB program'
        },
        {
          title: 'Commercial Buildings',
          value: 'Up to $250,000',
          detail: '$0.432 per kWh saved for systems under 100 kW'
        },
        {
          title: 'Business Write-off',
          value: '55% First-Year',
          detail: '30% ITC + accelerated depreciation'
        }
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
              Current rebate information by province with detailed incentive structures
            </p>
          </div>

          <div className="space-y-12">
            {provinces.map((province, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Province Header */}
                <div className="bg-gradient-to-r from-forest-500 to-sky-500 p-8 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-3xl font-bold">{province.name}</h3>
                      <p className="text-white/90">{province.code}</p>
                    </div>
                    <Zap className="w-8 h-8 text-white/80" />
                  </div>
                  <h4 className="text-xl font-semibold mt-4">{province.description}</h4>
                </div>

                {/* Province Description */}
                <div className="p-8">
                  <p className="text-gray-700 text-lg mb-8 leading-relaxed">{province.content}</p>

                  {/* Highlights Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {province.highlights.map((highlight, highlightIndex) => (
                      <div
                        key={highlightIndex}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200"
                      >
                        <p className="text-sm font-semibold text-forest-600 mb-2">{highlight.title}</p>
                        <p className="text-2xl font-bold text-forest-500 mb-2">{highlight.value}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{highlight.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alberta Municipal Financing Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="heading-lg mb-4">Alberta CEIP Municipal Programs</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl">
              The Clean Energy Improvement Program (CEIP) attaches financing to your property tax bill, not your personal credit. Compare rates and rebates by Alberta municipality.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-forest-500 text-white">
                  <th className="text-left px-6 py-4 font-semibold">City</th>
                  <th className="text-left px-6 py-4 font-semibold">Max Loan</th>
                  <th className="text-left px-6 py-4 font-semibold">Interest Rate</th>
                  <th className="text-left px-6 py-4 font-semibold">Rebate/Incentive</th>
                  <th className="text-left px-6 py-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { city: 'Airdrie', loan: '$50,000', rate: '2.75%', rebate: '$3,100 (Max)', notes: 'Retrofits only' },
                  { city: 'Banff (Comm)', loan: '$50,000', rate: '3.00%', rebate: '$750/kW ($15k max)', notes: '$7.5k min project' },
                  { city: 'Banff (Res)', loan: '$50,000', rate: '3.00%', rebate: '$450/kW ($9k max)', notes: '$7.5k min project' },
                  { city: 'Calgary', loan: '$50,000', rate: '3.75%', rebate: '10% ($5k max)', notes: 'Reopening Early 2026' },
                  { city: 'Canmore', loan: '$50,000', rate: '2.70%', rebate: '$500', notes: 'Residential' },
                  { city: 'Cold Lake', loan: '$50,000', rate: '3.10%', rebate: '$580', notes: 'Residential' },
                  { city: 'Devon', loan: '$50,000', rate: '4.00%', rebate: '$1,100', notes: 'Submission by Jan 31' },
                  { city: 'Drayton Valley', loan: '$50,000', rate: '4.16%', rebate: '$350', notes: 'Residential' },
                  { city: 'Edmonton (Comm)', loan: '$1M', rate: '6.00%', rebate: 'N/A', notes: 'High-cap financing' },
                  { city: 'Edmonton (Res)', loan: '$50,000', rate: '6.00%', rebate: 'N/A', notes: 'Min 3 energy upgrades' },
                  { city: 'Grand Prairie', loan: '$50,000', rate: '3.00%', rebate: '$525', notes: '25% paid upfront' },
                  { city: 'Jasper', loan: '$60,000', rate: '3.00%', rebate: 'N/A', notes: '5% Admin fee' },
                  { city: 'Leduc', loan: '100% Cost', rate: '0%*', rebate: '$1,350', notes: '0% on first 73% cost' },
                  { city: 'Lethbridge', loan: '$50,000', rate: '2.83%', rebate: '$1,350', notes: 'Multi-unit up to $5.4k' },
                  { city: 'Medicine Hat', loan: '$50,000', rate: '3.25%', rebate: 'Up to 10.2%', notes: 'Extra for pre-1990 homes' },
                  { city: 'Okotoks', loan: '$50,000', rate: '3.00%', rebate: '$500', notes: 'Residential' },
                  { city: 'Pincher Creek', loan: '$50,000', rate: '2.00%', rebate: '$450', notes: 'Per project' },
                  { city: 'Rocky Mountain', loan: '100% Cost', rate: '3.50%', rebate: '$2,100', notes: 'Residential' },
                  { city: 'Spruce Grove', loan: '$50,000', rate: '3.50%', rebate: '7.5% of costs', notes: 'Residential' },
                  { city: 'St. Albert', loan: '100% Cost', rate: '1.62%-3%', rebate: '$1,400', notes: 'Low capped interest' },
                  { city: 'Stettler', loan: '100% Cost', rate: '5.60%', rebate: '$580', notes: '25-year fixed' },
                  { city: 'Stirling', loan: '100% Cost', rate: 'Comp*', rebate: 'N/A', notes: 'Borrowing rate + 1%' },
                  { city: 'Strathcona', loan: '100% Cost', rate: '2.00%', rebate: '5% of cost', notes: 'Direct contractor payout' },
                  { city: 'Sturgeon (Comm)', loan: '$300,000', rate: 'Market', rebate: '5% of cost', notes: 'Below-market rates' },
                  { city: 'Sturgeon (Res)', loan: '$50,000', rate: '3.50%', rebate: '5% of cost', notes: 'Reduces loan balance' },
                  { city: 'Taber', loan: '100% Cost', rate: '2.00%', rebate: '$400 - $900', notes: '$900 if including Solar' },
                  { city: 'Westlock', loan: '100% Cost', rate: '3.00%', rebate: '$500', notes: 'Per property' },
                  { city: 'Wetaskiwin', loan: '100% Cost', rate: '3.20%', rebate: '$650', notes: 'Per project' },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} >
                    <td className="px-6 py-4 font-semibold text-forest-600">{row.city}</td>
                    <td className="px-6 py-4 text-gray-700">{row.loan}</td>
                    <td className="px-6 py-4 text-gray-700">{row.rate}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold text-green-600">{row.rebate}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <p className="text-gray-700 text-sm">
              <strong>CEIP Advantage:</strong> Financing is attached to your property tax bill, making it portable across property changes and leveraging your equity rather than personal credit.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Calculator CTA */}
      <section className="py-20 bg-gradient-to-br from-forest-50 to-sky-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Calculate Your Province-Specific Rebate Savings</h2>
          <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
            Our free solar calculator automatically accounts for federal ITCs, provincial rebates, and municipal CEIP programs in your area.
          </p>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            See exactly how much you'll save after rebates, tax credits, and battery incentives are applied to your specific situation.
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10 mb-8"
          >
            Get Your Solar Estimate
          </Link>
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <TrendingUp className="text-forest-500 mb-3" size={28} />
              <h4 className="font-bold text-forest-600 mb-2">See Real Savings</h4>
              <p className="text-gray-600 text-sm">Understand your payback period with all incentives included</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <DollarSign className="text-maple-500 mb-3" size={28} />
              <h4 className="font-bold text-maple-600 mb-2">Compare Options</h4>
              <p className="text-gray-600 text-sm">Solar only vs. solar + battery with provincial incentives</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <CheckCircle className="text-sky-500 mb-3" size={28} />
              <h4 className="font-bold text-sky-600 mb-2">Make Informed Decisions</h4>
              <p className="text-gray-600 text-sm">Get personalized recommendations based on your location and utility rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-8">
            <h3 className="text-xl font-bold text-amber-900 mb-4">Important: Rebate Program Updates</h3>
            <ul className="text-gray-700 space-y-2 text-sm">
              <li>✓ Rebate programs change frequently and vary by municipality</li>
              <li>✓ Always verify current eligibility and amounts with your provincial energy authority</li>
              <li>✓ Federal 30% Clean Technology ITC applies to most systems (verify with CRA)</li>
              <li>✓ Municipal CEIP programs may have specific installation requirements</li>
              <li>✓ Battery rebates often have minimum system size requirements</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
