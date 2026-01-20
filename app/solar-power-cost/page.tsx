'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  DollarSign,
  TrendingUp,
  Home,
  Calculator as CalculatorIcon,
  MapPin,
  BatteryCharging,
  Wrench,
  ShieldAlert,
  BarChart3,
  Globe,
  ClipboardList,
} from 'lucide-react'
import Link from 'next/link'

export default function SolarPowerCostPage() {
  const pvTypes = [
    {
      name: 'Thin-Film Panels',
      range: '$1.70 – $2.40 per watt',
      efficiency: '10 – 15% efficiency',
      note: 'Lowest cost; flexible; shorter lifespan',
    },
    {
      name: 'Polycrystalline Panels',
      range: '$2.00 – $2.80 per watt',
      efficiency: '15 – 17% efficiency',
      note: 'Lower-cost manufacturing using silicon fragments',
    },
    {
      name: 'Monocrystalline Panels',
      range: '$2.40 – $3.50 per watt',
      efficiency: '18 – 23% efficiency',
      note: 'High-purity silicon; durable; sleek appearance',
    },
    {
      name: 'Building-Integrated PV (BIPV)',
      range: '$3.00 – $4.50 per watt',
      efficiency: 'Varies by material',
      note: 'Integrated into facades, windows, or roof materials',
    },
    {
      name: 'Solar Shingles',
      range: '$4.00 – $7.00 per watt',
      efficiency: 'Varies; premium product',
      note: 'Roof-integrated aesthetics; specialty installation',
    },
  ]

  const pvTable = [
    { type: 'Monocrystalline', description: 'High efficiency and longevity; typically more expensive', cost: '$2.40 – $3.50' },
    { type: 'Polycrystalline', description: 'Moderate efficiency; more affordable than monocrystalline', cost: '$2.00 – $2.80' },
    { type: 'Thin Film', description: 'Lightweight and flexible; lower efficiency and shorter lifespan', cost: '$1.70 – $2.40' },
    { type: 'Building-Integrated PV', description: 'Integrated into building materials; higher aesthetic appeal', cost: '$3.00 – $4.50' },
    { type: 'Solar Shingles', description: 'Power-generating shingles; specialty product', cost: '$4.00 – $7.00' },
  ]

  const systemSizes = [
    { size: '5 kW residential', note: 'Higher end of price band due to smaller scale', cost: '$12,000 – $17,500 (at $2.40 – $3.50/W)' },
    { size: '10 kW residential', note: 'Lower end per watt thanks to scale', cost: '$24,000 – $35,000 (at $2.40 – $3.50/W)' },
  ]

  const costFactors = [
    {
      title: 'Panel Type and Efficiency',
      impact: 'High',
      description: 'High-efficiency monocrystalline costs more but needs fewer panels for the same output—ideal for limited roof space.',
    },
    {
      title: 'Number of Panels / System Size',
      impact: 'High',
      description: 'Larger systems cost more in total but reduce cost per watt due to economies of scale.',
    },
    {
      title: 'Location',
      impact: 'Medium',
      description: 'Provincial labor, permits, and installer density impact pricing. Ontario often ranges $2.42 – $3.05/W.',
    },
    {
      title: 'Installation Complexity',
      impact: 'Medium',
      description: 'Roof pitch, shading, and structural upgrades add labor and engineering costs.',
    },
    {
      title: 'Battery Storage',
      impact: 'High',
      description: 'Adds backup power and peak shaving but increases capex; sizing matters for ROI.',
    },
    {
      title: 'Incentives & Taxes',
      impact: 'High',
      description: 'Federal ITCs, provincial rebates, and GST/HST ITC claims can materially lower net costs.',
    },
  ]

  const otherFactors = [
    {
      title: 'Quality of Components',
      detail: 'Brands like SunPower Maxeon, Canadian Solar, or REC offer longevity and stronger warranties.',
    },
    {
      title: 'Market Conditions',
      detail: 'Tariffs and supply chain shifts can raise panel prices; Canada may mirror recent US tariffs.',
    },
    {
      title: 'Permitting Fees',
      detail: 'Cities like Toronto require building + ESA permits and utility compliance; REA for Class 3 systems has a $1,000 fee.',
    },
    {
      title: 'Taxes',
      detail: 'GST/HST applies; businesses with a GST/HST number may claim ITCs to offset tax paid.',
    },
    {
      title: 'Shipping & Delivery',
      detail: 'Remote regions may see higher logistics costs that impact total price.',
    },
    {
      title: 'Monitoring Systems',
      detail: '$200 – $500 setup plus potential subscriptions for performance tracking.',
    },
    {
      title: 'Maintenance',
      detail: '$150 – $400/year for professional cleaning and inspection, climate dependent.',
    },
    {
      title: 'Insurance',
      detail: '$75 – $150/year typical premium increase; confirm coverage with your provider.',
    },
  ]

  const provinceCosts = [
    { province: 'Ontario', cost: '$2.42 – $3.05', note: 'Competitive installer network; strong incentives' },
    { province: 'British Columbia', cost: '$2.60 – $3.27', note: 'Higher labor costs; rebates and net metering help' },
    { province: 'Alberta', cost: '$2.40 – $3.02', note: 'Competitive market; deregulated energy supports value' },
    { province: 'Manitoba', cost: '$2.60 – $3.27', note: 'Stable pricing; fewer installers' },
    { province: 'Saskatchewan', cost: '$2.60 – $3.27', note: 'Growing market; similar to Manitoba' },
    { province: 'Quebec', cost: '$2.60 – $3.27', note: 'Low hydro rates slow adoption; efficiency programs exist' },
    { province: 'New Brunswick', cost: '$2.60 – $3.27', note: 'Incentives and growing renewable interest' },
    { province: 'Nova Scotia', cost: '$2.60 – $3.27', note: 'SolarHomes support; rising rates improve ROI' },
    { province: 'Prince Edward Island', cost: '$2.60 – $3.27', note: 'Community energy programs; incentives available' },
    { province: 'Newfoundland and Labrador', cost: '$4.00+', note: 'Limited installers; logistics raise costs' },
    { province: 'Yukon Territory', cost: '$2.29 – $2.81', note: 'Logistics manageable; specific local conditions' },
    { province: 'Northwest Territories', cost: '$2.43 – $2.68', note: 'Remote logistics impact pricing' },
    { province: 'Nunavut', cost: '$4.00+', note: 'Remote transport makes solar premium priced' },
  ]

  const batteryCosts = [
    { size: 'Small (5 kWh)', cost: '$4,000 – $10,000', note: 'Partial backup or limited load shifting' },
    { size: 'Mid-range (10 kWh)', cost: '$7,000 – $20,000', note: 'Common for residential solar + battery' },
    { size: 'Large (20 kWh)', cost: '$12,000 – $35,000', note: 'Whole-home backup and longer outages' },
  ]

  const ctaItems = [
    {
      title: 'Compare PV Types',
      detail: 'See thin-film vs. mono vs. BIPV for your roof and climate',
      icon: <BarChart3 className="text-forest-500 mb-3" size={26} />,
    },
    {
      title: 'Local Pricing',
      detail: 'We localize costs by province, labor, and permitting',
      icon: <MapPin className="text-maple-500 mb-3" size={26} />,
    },
    {
      title: 'Battery Scenarios',
      detail: 'Model backup power and peak shaving payback',
      icon: <BatteryCharging className="text-sky-500 mb-3" size={26} />,
    },
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

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 max-w-4xl">
            <p className="text-gray-700 leading-relaxed">
              Investing in solar panels is an effective way to reduce energy costs and minimize environmental impact. Prices vary widely, and understanding the associated expenses is crucial to making informed decisions. This guide covers photovoltaic (PV) costs in Canada, factors that influence pricing, regional differences, installation considerations, and available incentives.
            </p>
            <p className="text-gray-700 leading-relaxed">
              In general, the average cost to install solar panels in Canada is <strong>$2.40 to $3.30 per watt</strong> for monocrystalline panels, which are the most common. Below we break costs down by PV type, system size, and province so you can budget with confidence.
            </p>
            <div className="bg-forest-50 border-l-4 border-forest-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CalculatorIcon className="text-forest-500 flex-shrink-0 mt-1" size={20} />
                <p className="text-gray-800 text-sm leading-relaxed">
                  Use our estimator to see installed costs, incentives, and payback for your address. We localize labor, permitting, and rebate assumptions for better accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PV Type Costs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Costs Explained: Prices by PV Type</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              How common PV technologies are priced and why
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pvTypes.map((pv) => (
              <div key={pv.name} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="text-forest-500" size={20} />
                  <h3 className="font-bold text-forest-600">{pv.name}</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2 font-semibold">{pv.range}</p>
                <p className="text-xs text-gray-600 mb-2">{pv.efficiency}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{pv.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest-500 text-white">
                <tr>
                  <th className="px-6 py-3 font-semibold">Panel Type</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold">Cost / Watt Installed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pvTable.map((row) => (
                  <tr key={row.type}>
                    <td className="px-6 py-4 font-semibold text-forest-600">{row.type}</td>
                    <td className="px-6 py-4 text-gray-700">{row.description}</td>
                    <td className="px-6 py-4 text-gray-800">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* System Size Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Price by Kilowatt System</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Larger systems reduce cost per watt through scale
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {systemSizes.map((item) => (
              <div key={item.size} className="bg-gradient-to-br from-sky-50 to-forest-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Home className="text-forest-500" size={22} />
                  <h3 className="font-bold text-forest-700">{item.size}</h3>
                </div>
                <p className="text-gray-700 text-sm mb-2">{item.cost}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factors Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Factors Affecting Costs</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">What drives pricing up or down</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {costFactors.map((factor) => (
              <div key={factor.title} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="text-forest-500" size={20} />
                  <div>
                    <h3 className="font-bold text-forest-600">{factor.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      factor.impact === 'High'
                        ? 'bg-red-100 text-red-700'
                        : factor.impact === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {factor.impact} Impact
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Factors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Other Factors Affecting Cost</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Beyond panels and labor</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherFactors.map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldAlert className="text-maple-500" size={20} />
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Pricing Differences Across the Country</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Average installed cost per watt by province and territory (2026)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest-500 text-white">
                <tr>
                  <th className="px-6 py-3 font-semibold">Province / Territory</th>
                  <th className="px-6 py-3 font-semibold">Price per Watt ($CAD)</th>
                  <th className="px-6 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {provinceCosts.map((row, idx) => (
                  <tr key={row.province} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-semibold text-forest-600">{row.province}</td>
                    <td className="px-6 py-4 text-gray-800">{row.cost}</td>
                    <td className="px-6 py-4 text-gray-700">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 space-y-3 text-sm text-gray-700 leading-relaxed bg-white rounded-xl p-6 border border-gray-100">
            <p><strong>Overview highlights:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ontario: $2.42 – $3.05/W; competitive installer network and incentives.</li>
              <li>British Columbia: $2.60 – $3.27/W; higher labor costs offset by rebates and net metering.</li>
              <li>Alberta: $2.40 – $3.02/W; deregulated market keeps pricing competitive.</li>
              <li>Newfoundland and Labrador, Nunavut: $4.00+ due to logistics and limited installer availability.</li>
              <li>Territories vary with transport and climate; confirm local labor and permitting.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Battery Costs */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Cost of Solar Battery Storage</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Typical installed pricing ranges from $700 to $2,000 per kWh depending on chemistry and brand
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {batteryCosts.map((battery) => (
              <div key={battery.size} className="bg-gradient-to-br from-amber-50 to-forest-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <BatteryCharging className="text-forest-500" size={22} />
                  <h3 className="font-bold text-gray-900">{battery.size}</h3>
                </div>
                <p className="text-gray-800 font-semibold text-sm mb-2">{battery.cost}</p>
                <p className="text-gray-700 text-sm leading-relaxed">{battery.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="mb-2">
              Battery pricing reflects chemistry, capacity, brand, and warranty. Lithium-ion costs more upfront but offers longer lifespan and lower maintenance than lead acid. Larger batteries generally reduce $/kWh installed. Popular brands like Tesla Powerwall command premiums over lesser-known alternatives.
            </p>
            <p>
              Batteries enable backup power, outage resilience, and peak shaving. Pairing them with time-of-use rates (e.g., Ontario ULO) or export/import switching (e.g., Alberta Solar Club) improves payback.
            </p>
          </div>
        </div>
      </section>

      {/* DIY vs Professional */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Professional Installation vs DIY</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Safety, compliance, and long-term performance</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Wrench className="text-forest-500" size={22} />
                <h3 className="font-bold text-gray-900">Professional Install</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Streamlined permitting, ESA sign-offs, and utility interconnection</li>
                <li>• Warranty protection and workmanship guarantees</li>
                <li>• Proper structural, snow load, and wind considerations for Canadian climates</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <ShieldAlert className="text-maple-500" size={22} />
                <h3 className="font-bold text-gray-900">DIY Considerations</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Safety and code compliance: national/provincial electrical codes apply</li>
                <li>• Permitting: building + ESA permits, plus zoning for ground mounts</li>
                <li>• Climate: snow loads, wind gusts, and temperature swings demand proper design</li>
                <li>• A licensed electrician must sign off; finding one for DIY can be difficult</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Incentives Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Federal, Provincial, and Utility Incentives</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Incentives can materially lower net costs—always verify current eligibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-forest-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="text-forest-500" size={20} />
                <h3 className="font-bold text-gray-900">Federal Programs</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Canada Greener Homes Grant is closed to new applicants; Canada Greener Homes Loan remains available. Federal Clean Technology ITC can reduce capital costs; accelerated depreciation helps businesses reach ~55% first-year write-off.
              </p>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="text-sky-500" size={20} />
                <h3 className="font-bold text-gray-900">Provincial & Municipal</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Programs like Ontario HRS, Alberta CEIP, and Nova Scotia SolarHomes reduce upfront costs. Municipal permits and approvals vary—factor ESA/building permits where applicable.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <ClipboardList className="text-amber-600" size={20} />
                <h3 className="font-bold text-gray-900">Utility Programs</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Net metering and time-of-use optimization (e.g., Ontario ULO) or export/import switching (e.g., Alberta Solar Club) can improve ROI without adding hardware costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-forest-50 to-sky-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Get Your Personalized Solar Cost Estimate</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Our calculator models panel type, local labor, permitting, incentives, and batteries for your address.
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10 mb-10"
          >
            Calculate Your Solar Costs
          </Link>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {ctaItems.map((item) => (
              <div key={item.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                {item.icon}
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
