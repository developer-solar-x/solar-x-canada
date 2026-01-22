'use client'

import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DollarSign, MapPin, CheckCircle, Info, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import Head from 'next/head'
import Script from 'next/script'
import { useState } from 'react'

// SEO Metadata Export
export const metadata: Metadata = {
  title: 'Solar Rebates & Incentives Canada 2026 | Solar Calculator by Province',
  description: 'Compare solar rebates, tax credits, and incentives across Canada. Get province-specific solar calculator data, CEIP financing in Alberta, Home Renovation Savings in Ontario, and energy efficiency programs.',
  keywords: [
    'solar rebates Canada',
    'solar incentives Canada',
    'solar tax credit Canada',
    'solar calculator Canada',
    'Ontario solar rebates',
    'Alberta solar rebates',
    'BC solar rebates',
    'solar energy incentives',
    'renewable energy rebates',
    'home solar rebates',
    'solar panel rebates',
    'federal solar tax credit',
    'provincial solar incentives',
    'CEIP financing',
    'Alberta CEIP',
    'Home Renovation Savings',
    'HRS program',
    'solar power cost calculator',
    'best solar rebates',
    'solar savings calculator',
  ],
  openGraph: {
    title: 'Solar Rebates & Incentives Across Canada | Compare by Province',
    description: 'Find solar rebates, incentives, and financing options in your province. Comprehensive solar calculator for Canada.',
    type: 'website',
    url: 'https://solarcalculatorcanada.org/solar-rebates',
  },
  alternates: {
    canonical: 'https://solarcalculatorcanada.org/solar-rebates',
  },
}

export default function SolarRebatesPage() {
  const [activeProvince, setActiveProvince] = useState(0)
  
  // Comprehensive Local Business Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://solarcalculatorcanada.org',
    name: 'Solar X Canada - Solar Calculator & Rebate Guide',
    description: 'Canada\'s leading solar rebate calculator and incentive guide. Compare solar rebates, tax credits, and energy efficiency programs across all provinces.',
    url: 'https://solarcalculatorcanada.org/solar-rebates',
    image: 'https://solarcalculatorcanada.org/logo.png',
    priceRange: '$$',
    areaServed: [
      { '@type': 'State', name: 'Ontario' },
      { '@type': 'State', name: 'Alberta' },
      { '@type': 'State', name: 'Saskatchewan' },
      { '@type': 'State', name: 'Nova Scotia' },
      { '@type': 'State', name: 'New Brunswick' },
      { '@type': 'State', name: 'British Columbia' },
      { '@type': 'State', name: 'Manitoba' },
      { '@type': 'State', name: 'Quebec' },
      { '@type': 'State', name: 'Prince Edward Island' },
      { '@type': 'State', name: 'Newfoundland and Labrador' },
    ],
    sameAs: [
      'https://www.facebook.com/solarxcanada',
      'https://www.twitter.com/solarxcanada',
      'https://www.linkedin.com/company/solarxcanada',
    ],
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://solarcalculatorcanada.org'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Solar Rebates & Incentives',
        item: 'https://solarcalculatorcanada.org/solar-rebates'
      }
    ]
  }

  // Enhanced FAQ Schema with more keywords
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the best solar rebates available in Ontario?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ontario offers the Home Renovation Savings (HRS) program with up to $10,000 back ($5,000 solar + $5,000 battery) for load displacement systems. The ULO rate structure also allows peak-hour arbitrage with rates reaching 39.1¢/kWh. This is one of the best solar incentives in Canada.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the Alberta Solar Club work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Alberta Solar Club™ allows members to switch between a high-export rate (30¢/kWh) in summer to sell surplus solar energy and a low-import rate (~8¢/kWh) in winter, maximizing solar savings throughout the year.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is CEIP financing in Alberta?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CEIP (Clean Energy Improvement Program) is a municipal financing program in Alberta that attaches solar installation costs to your property tax bill. Interest rates range from 0% to 6% depending on the municipality, with rebates between $350-$2,100.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much is the federal solar tax credit in Canada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The federal 30% Clean Technology Investment Tax Credit (ITC) applies to most residential and commercial solar systems in Canada. Combined with accelerated depreciation, businesses can achieve up to 55% first-year write-offs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there solar rebates in British Columbia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. BC offers the Better Homes Energy Savings Program with heat pump rebates up to $24,500, window/door rebates up to $2,000, and net metering for solar systems. Check our solar calculator for current BC solar incentives.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the solar power cost savings calculator?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our solar calculator estimates your potential solar savings based on your location, energy usage, and available rebates. It helps you compare solar costs and returns across Canadian provinces.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which provinces have the best solar incentives in Canada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Alberta offers the most comprehensive rebate ecosystem with 27+ municipal CEIP programs and the Solar Club net metering option. Ontario has excellent rebates through Home Renovation Savings and ULO rates. Nova Scotia and New Brunswick also offer strong solar incentives. Use our solar calculator to compare your province.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does renewable energy tax credit work in Canada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The federal renewable energy tax credit provides 30% of eligible costs for solar installations. Many provinces add additional solar tax credits and rebates. Combined provincial and federal incentives can reduce solar installation costs by 40-50%.',
        },
      }
    ],
  }

  // Product/Service Schema for Solar Services
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Solar Rebate Information & Calculator',
    description: 'Comprehensive solar rebate comparison and savings calculator for Canada',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Solar X Canada',
      url: 'https://solarcalculatorcanada.org'
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada'
    },
    availableLanguage: ['en', 'fr']
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What solar rebates are available in Ontario?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ontario offers the Home Renovation Savings (HRS) program with up to $10,000 back ($5,000 solar + $5,000 battery) for load displacement systems. The ULO rate structure also allows peak-hour arbitrage with rates reaching 39.1¢/kWh.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the Alberta Solar Club?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Solar Club™ allows members to switch between a high-export rate (30¢/kWh) in summer to sell surplus energy and a low-import rate (~8¢/kWh) in winter, maximizing savings throughout the year.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much can I save with CEIP financing in Alberta?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CEIP (Clean Energy Improvement Program) financing varies by municipality. Interest rates range from 1.62% to 6%, with rebates between $350 and $2,100 per project. Financing is attached to your property tax bill, not personal credit.',
        },
      },
      {
        '@type': 'Question',
        name: 'What federal tax credits apply to solar in Canada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The federal 30% Clean Technology Investment Tax Credit (ITC) applies to most residential and commercial solar systems. Combined with accelerated depreciation, businesses can achieve up to 55% first-year write-offs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there solar rebates in Nova Scotia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Efficiency Nova Scotia offers business rebates up to $30,000 (~25¢ per kWh of yearly production). Residential options include PACE and CEIP loans for no-money-down solar installations.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which provinces offer the best solar rebates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Alberta offers the most comprehensive rebate ecosystem with municipal CEIP programs in 27+ cities, favorable net metering through the Solar Club, and business tax credits. Nova Scotia and New Brunswick also offer strong incentives. Use our calculator to compare your province.',
        },
      },
    ],
  }
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
    {
      name: 'Ontario',
      code: 'ON',
      description: 'Home Renovations & Heat Pumps',
      content: `Ontario offers comprehensive energy upgrade incentives through the Home Renovation Savings Program and substantial heat pump rebates. Municipal loan programs like Toronto's HELP provide up to $125,000 in financing for multi-upgrade energy improvements.`,
      highlights: [
        {
          title: 'Home Renovation Savings',
          value: 'Up to $10,000',
          detail: 'Including solar panels, heat pumps, windows, insulation'
        },
        {
          title: 'Heat Pump Rebates',
          value: 'Up to $12,000',
          detail: 'Ground-source systems in 2026; air-source ~$7,500'
        },
        {
          title: 'Municipal HELP Program',
          value: 'Up to $125,000',
          detail: 'Multi-upgrade financing attached to property tax'
        },
        {
          title: 'ENERGY STAR Appliances',
          value: 'Utility Rebates',
          detail: 'Heat pump dryers, washers, dishwashers eligible'
        }
      ],
    },
    {
      name: 'British Columbia',
      code: 'BC',
      description: 'Better Homes & Heat Pump Savings',
      content: `British Columbia's Better Homes Energy Savings Program provides substantial heat pump rebates, while utility partners offer window, door, and solar incentives. Net metering allows surplus generation to be credited toward future bills.`,
      highlights: [
        {
          title: 'Better Homes Heat Pump',
          value: 'Up to $24,500',
          detail: 'Depends on income, household type, current heating system'
        },
        {
          title: 'Window & Door Rebates',
          value: 'Up to $2,000',
          detail: 'ENERGY STAR certified upgrades through utilities'
        },
        {
          title: 'Net Metering Solar Credits',
          value: 'Future Bill Credits',
          detail: 'Surplus generation credited under utility net metering options'
        }
      ],
    },
    {
      name: 'Quebec',
      code: 'QC',
      description: 'Rénoclimat & Clean Transportation',
      content: `Quebec's Rénoclimat Program offers comprehensive energy retrofit assistance starting with a home energy assessment. Additional incentives include EV rebates and charging infrastructure support for clean transportation.`,
      highlights: [
        {
          title: 'Rénoclimat Program',
          value: 'Home Assessment + Rebates',
          detail: 'Insulation, air sealing, heating system upgrades including heat pumps'
        },
        {
          title: 'Heat Pump Rebates',
          value: 'Retrofit Eligible',
          detail: 'Part of comprehensive Rénoclimat retrofit package'
        },
        {
          title: 'EV & Charging Rebates',
          value: 'Clean Transport',
          detail: 'Electric vehicles and EV charging infrastructure incentives'
        }
      ],
    },
    {
      name: 'Manitoba',
      code: 'MB',
      description: 'Window Rebates & EV Incentives',
      content: `Efficiency Manitoba offers rebates on ENERGY STAR certified windows and doors, plus home energy financing programs. EV incentives provide ~$4,000 for new vehicles and ~$2,500 for used EVs.`,
      highlights: [
        {
          title: 'Window & Door Rebates',
          value: 'Per Unit',
          detail: 'ENERGY STAR certified upgrades through Efficiency Manitoba'
        },
        {
          title: 'Home Energy Financing',
          value: 'Available',
          detail: 'Dedicated programs for residential energy upgrades'
        },
        {
          title: 'New EV Rebate',
          value: '~$4,000',
          detail: 'Electric vehicles and clean transportation incentives'
        },
        {
          title: 'Used EV Rebate',
          value: '~$2,500',
          detail: 'Support for second-hand electric vehicle purchases'
        }
      ],
    },
    {
      name: 'Prince Edward Island',
      code: 'PEI',
      description: 'Building Envelope & Heat Pump Rebates',
      content: `PEI offers building envelope rebates for insulation and ENERGY STAR windows/doors, often requiring an energy audit. Point-of-sale heat pump rebates and solar electric programs make renewable energy more accessible.`,
      highlights: [
        {
          title: 'Building Envelope Rebate',
          value: 'Insulation & Windows',
          detail: 'Requires energy audit; ENERGY STAR doors/windows eligible'
        },
        {
          title: 'Heat Pump Rebates',
          value: 'Point-of-Sale',
          detail: 'Mini-split and other heat pump systems'
        },
        {
          title: 'Solar Electric Rebates',
          value: 'Renewable Energy',
          detail: 'Programs making solar installations more accessible'
        }
      ],
    },
    {
      name: 'Newfoundland & Labrador',
      code: 'NL',
      description: 'Home Repair & Federal Programs',
      content: `Newfoundland & Labrador's Provincial Home Repair Program offers up to ~$5,000 (or higher in Labrador) for essential home repairs including energy systems. Federal Green Homes loans apply; specific provincial solar rebates are currently limited.`,
      highlights: [
        {
          title: 'Provincial Home Repair',
          value: 'Up to $5,000',
          detail: 'Essential repairs including heating and windows/doors'
        },
        {
          title: 'Labrador Enhancement',
          value: 'Higher Limits',
          detail: 'Additional support available for Labrador region'
        },
        {
          title: 'Federal Green Homes',
          value: 'Loans Available',
          detail: 'Federal rebates and financing programs apply'
        }
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Solar Rebates & Incentives Across Canada
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Discover the best solar tax credits, federal incentives, and provincial rebates. Use our solar calculator to compare solar energy costs and savings by province
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              href="/estimator" 
              className="px-8 py-3 bg-white text-forest-600 font-semibold rounded-lg hover:bg-sky-50 transition"
            >
              Try Solar Calculator
            </Link>
            <Link 
              href="/quick-estimate" 
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition"
            >
              Quick Estimate
            </Link>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-lg mb-6">Understanding Solar Rebates & Tax Credits in Canada</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Solar rebates are financial incentives offered by federal, provincial, and municipal governments to encourage homeowners and businesses to install solar panel systems. These solar energy incentives can significantly reduce the upfront cost of going solar, making renewable energy more accessible across Canada.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Solar rebates and tax credits vary by province, municipality, and can change over time. It's important to check current programs in your area and understand eligibility requirements before making your solar investment. Our <Link href="/estimator" className="text-forest-600 font-semibold hover:underline">solar calculator</Link> automatically accounts for available solar rebates and incentives in your province.
              </p>
              <div className="bg-sky-50 rounded-lg p-6 border-l-4 border-sky-500">
                <div className="flex items-start gap-3">
                  <Info className="text-sky-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-gray-700 text-sm">
                    <strong>Tip:</strong> Combine federal solar tax credits (30% ITC) with provincial rebates and municipal CEIP programs to maximize your solar savings calculator results. Some provinces like Alberta and Ontario offer the best solar incentives in Canada.
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
                    <h3 className="font-bold text-forest-500 mb-2">Reduce Solar Installation Costs</h3>
                    <p className="text-gray-600 text-sm">
                      Solar panel rebates and government incentives can reduce your initial investment by thousands of dollars across Canada
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-maple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-maple-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-maple-500 mb-2">Faster Solar ROI & Payback</h3>
                    <p className="text-gray-600 text-sm">
                      Lower solar energy costs with federal tax credits mean faster return on investment for your system
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-sky-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-500 mb-2">Province & City-Specific Programs</h3>
                    <p className="text-gray-600 text-sm">
                      Each Canadian province and municipality has different renewable energy programs, eligibility, and incentive amounts
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
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Solar Rebates & Tax Incentives by Canadian Province</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compare provincial solar rebate programs, tax credits, and energy efficiency incentives. Get current information for your province with our interactive solar calculator
            </p>
          </div>

          {/* Province Tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-2 bg-gradient-to-r from-forest-50 to-sky-50 border-b-2 border-forest-100">
              {provinces.map((province, index) => (
                <button
                  key={index}
                  onClick={() => setActiveProvince(index)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 ${
                    activeProvince === index
                      ? 'bg-gradient-to-r from-forest-500 to-sky-500 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-forest-300 hover:shadow-md'
                  }`}
                >
                  {province.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {provinces.map((province, index) => (
                <div
                  key={index}
                  className={`transition-opacity duration-300 ${activeProvince === index ? 'block opacity-100' : 'hidden opacity-0'}`}
                >
                  {/* Province Header */}
                  <div className="bg-gradient-to-r from-forest-600 via-forest-500 to-sky-500 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10">
                      <Zap className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10 flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-4xl font-bold">{province.name}</h3>
                        <p className="text-white/80 text-lg mt-1">{province.code}</p>
                      </div>
                      <Zap className="w-12 h-12 text-white/90 animate-pulse" />
                    </div>
                    <h4 className="text-xl font-semibold mt-4 text-white/95">{province.description}</h4>
                  </div>

                  {/* Province Description */}
                  <div className="p-8 bg-white">
                    <p className="text-gray-700 text-lg mb-8 leading-relaxed">{province.content}</p>

                    {/* Highlights Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {province.highlights.map((highlight, highlightIndex) => (
                        <div
                          key={highlightIndex}
                          className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-forest-100 hover:border-forest-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                        >
                          <p className="text-xs font-bold text-forest-500 uppercase tracking-wide mb-3">{highlight.title}</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-forest-600 to-sky-500 bg-clip-text text-transparent mb-3">{highlight.value}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{highlight.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Alberta Municipal Financing Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="heading-lg mb-4">Alberta CEIP Municipal Programs</h2>
            <div className="text-lg text-gray-600 mb-8 max-w-2xl space-y-4">
              <p>
                Alberta's Clean Energy Improvement Program (CEIP) allows property owners to finance eligible energy upgrades through their municipality. Instead of relying on personal loans or credit cards, approved project costs are repaid through a dedicated charge on the property tax bill.
              </p>
              <p>
                Because CEIP programs are administered locally, loan limits, interest rates, and incentives can vary significantly by city or town. Below is a municipality-by-municipality snapshot to help homeowners and commercial property owners compare available options across Alberta.
              </p>
            </div>
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
                  { city: 'Medicine Hat', loan: '$50,000', rate: '3.25%', rebate: 'Up to 10.2%', notes: 'Extra for pre-1990 homes' },
                  { city: 'Spruce Grove', loan: '$50,000', rate: '3.50%', rebate: '7.5% of costs', notes: 'Residential' },
                  { city: 'Banff (Res)', loan: '$50,000', rate: '3.00%', rebate: '$450/kW (up to $9k)', notes: '$7.5k min project' },
                  { city: 'Jasper', loan: '$60,000', rate: '3.00%', rebate: 'N/A', notes: '5% admin fee' },
                  { city: 'Lethbridge', loan: '$50,000', rate: '2.83%', rebate: '$1,350', notes: 'Multi-unit up to $5.4k' },
                  { city: 'Sturgeon (Comm)', loan: '$300,000', rate: 'Market', rebate: '5% of cost', notes: 'Below-market rates' },
                  { city: 'Airdrie', loan: '$50,000', rate: '2.75%', rebate: '$3,100 (max)', notes: 'Retrofits only' },
                  { city: 'Okotoks', loan: '$50,000', rate: '3.00%', rebate: '$500', notes: 'Residential' },
                  { city: 'Edmonton (Comm)', loan: '$1,000,000', rate: '6.00%', rebate: 'N/A', notes: 'High-cap financing' },
                  { city: 'Taber', loan: '100% Cost', rate: '2.00%', rebate: '$400–$900', notes: '$900 if including solar' },
                  { city: 'Devon', loan: '$50,000', rate: '4.00%', rebate: '$1,100', notes: 'Submission by Jan 31' },
                  { city: 'St. Albert', loan: '100% Cost', rate: '1.62%–3.00%', rebate: '$1,400', notes: 'Low capped interest' },
                  { city: 'Canmore', loan: '$50,000', rate: '2.70%', rebate: '$500', notes: 'Residential' },
                  { city: 'Grand Prairie', loan: '$50,000', rate: '3.00%', rebate: '$525', notes: '25% paid upfront' },
                  { city: 'Pincher Creek', loan: '$50,000', rate: '2.00%', rebate: '$450', notes: 'Per project' },
                  { city: 'Strathcona', loan: '100% Cost', rate: '2.00%', rebate: '5% of cost', notes: 'Direct contractor payout' },
                  { city: 'Leduc', loan: '100% Cost', rate: '0%*', rebate: '$1,350', notes: '0% on first 73% cost' },
                  { city: 'Cold Lake', loan: '$50,000', rate: '3.10%', rebate: '$580', notes: 'Residential' },
                  { city: 'Banff (Comm)', loan: '$50,000', rate: '3.00%', rebate: '$750/kW (up to $15k)', notes: '$7.5k min project' },
                  { city: 'Drayton Valley', loan: '$50,000', rate: '4.16%', rebate: '$350', notes: 'Residential' },
                  { city: 'Stettler', loan: '100% Cost', rate: '5.60%', rebate: '$580', notes: '25-year fixed' },
                  { city: 'Sturgeon (Res)', loan: '$50,000', rate: '3.50%', rebate: '5% of cost', notes: 'Reduces loan balance' },
                  { city: 'Rocky Mountain', loan: '100% Cost', rate: '3.50%', rebate: '$2,100', notes: 'Residential' },
                  { city: 'Stirling', loan: '100% Cost', rate: 'Comp*', rebate: 'N/A', notes: 'Borrowing rate + 1%' },
                  { city: 'Edmonton (Res)', loan: '$50,000', rate: '6.00%', rebate: 'N/A', notes: 'Min 3 energy upgrades' },
                  { city: 'Westlock', loan: '100% Cost', rate: '3.00%', rebate: '$500', notes: 'Per property' },
                  { city: 'Wetaskiwin', loan: '100% Cost', rate: '3.20%', rebate: '$650', notes: 'Per project' },
                  { city: 'Calgary', loan: '$50,000', rate: '3.75%', rebate: '10% (up to $5k)', notes: 'Reopening early 2026' },
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

      {/* Local Service Areas Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Solar Rebates & Incentives by Canadian Region</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find solar energy incentives, cost calculators, and rebate information for your region across Canada
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Ontario regions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-blue-900">Ontario Solar Rebates</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Home Renovation Savings + ULO Rates + Solar Tax Credit</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Toronto Solar Rebates</li>
                <li>• Ottawa Energy Incentives</li>
                <li>• Hamilton Solar</li>
                <li>• Greater Toronto Area</li>
              </ul>
              <Link href="/estimator?province=ON" className="inline-block mt-4 text-blue-600 font-semibold hover:underline text-sm">
                Compare Ontario solar savings →
              </Link>
            </div>

            {/* Alberta regions */}
            <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-lg p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-red-600" size={24} />
                <h3 className="text-xl font-bold text-red-900">Alberta Solar Incentives</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Solar Club™ + 27 Municipal CEIP Programs</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Calgary CEIP Solar</li>
                <li>• Edmonton Solar Rebates</li>
                <li>• Red Deer Energy Programs</li>
                <li>• Lethbridge CEIP Financing</li>
              </ul>
              <Link href="/estimator?province=AB" className="inline-block mt-4 text-red-600 font-semibold hover:underline text-sm">
                Check Alberta solar incentives →
              </Link>
            </div>

            {/* Atlantic Canada regions */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg p-6 border border-teal-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-teal-600" size={24} />
                <h3 className="text-xl font-bold text-teal-900">Atlantic Canada Solar</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Energy Security Programs + Business Tax Credits</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Nova Scotia Solar Rebates</li>
                <li>• New Brunswick CEIP Programs</li>
                <li>• PEI Solar Incentives</li>
              </ul>
              <Link href="/estimator?province=NS" className="inline-block mt-4 text-teal-600 font-semibold hover:underline text-sm">
                Compare Atlantic solar incentives →
              </Link>
            </div>

            {/* Saskatchewan */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-green-600" size={24} />
                <h3 className="text-xl font-bold text-green-900">Saskatchewan Solar</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Self-Consumption Focus + Battery Storage Rebates</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Regina Solar Programs</li>
                <li>• Saskatoon Energy Rebates</li>
                <li>• Prince Albert Solar</li>
              </ul>
              <Link href="/estimator?province=SK" className="inline-block mt-4 text-green-600 font-semibold hover:underline text-sm">
                Check Saskatchewan rates →
              </Link>
            </div>

            {/* British Columbia */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-purple-600" size={24} />
                <h3 className="text-xl font-bold text-purple-900">British Columbia</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Provincial + federal rebates</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Vancouver</li>
                <li>• Victoria</li>
                <li>• Surrey</li>
              </ul>
              <Link href="/estimator?province=BC" className="inline-block mt-4 text-purple-600 font-semibold hover:underline text-sm">
                Check BC rates →
              </Link>
            </div>

            {/* Manitoba */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-indigo-600" size={24} />
                <h3 className="text-xl font-bold text-indigo-900">Manitoba Solar</h3>
              </div>
              <p className="text-gray-700 mb-4 text-sm">Federal ITC + provincial programs</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Winnipeg</li>
                <li>• Brandon</li>
                <li>• Portable programs</li>
              </ul>
              <Link href="/estimator?province=MB" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline text-sm">
                Check Manitoba rates →
              </Link>
            </div>
          </div>

          <div className="mt-12 bg-forest-50 border-l-4 border-forest-500 rounded-lg p-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>Serving Solar Customers Across Canada:</strong> Each province and municipality has unique rebate structures, utility rates, and incentive programs. Our calculator is optimized for location-specific recommendations. Enter your address or province to see rebates available in your area.
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
              <li>✓ Federal 30% Clean Technology ITC applies to most solar systems (verify with CRA)</li>
              <li>✓ Municipal CEIP programs may have specific solar installation requirements</li>
              <li>✓ Battery storage rebates often have minimum system size requirements</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Related Resources Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Solar Resources & Tools</h2>
            <p className="text-gray-600">Use our solar calculator tools and guides to maximize your savings</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-forest-50 to-sky-50 rounded-lg p-6 border border-forest-100">
              <h3 className="text-xl font-bold text-forest-700 mb-3">
                <Link href="/estimator" className="hover:underline">Solar Calculator Tool</Link>
              </h3>
              <p className="text-gray-600 mb-4">
                Calculate your solar installation costs, savings, and ROI with our comprehensive solar power cost calculator featuring real-time provincial rebate data.
              </p>
              <Link href="/estimator" className="text-forest-600 font-semibold hover:underline">
                Start Your Solar Calculation →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-maple-50 to-orange-50 rounded-lg p-6 border border-maple-100">
              <h3 className="text-xl font-bold text-maple-700 mb-3">
                <Link href="/quick-estimate" className="hover:underline">Quick Solar Estimate</Link>
              </h3>
              <p className="text-gray-600 mb-4">
                Get an instant solar energy estimate for your home. Our quick estimate tool considers your location, roof condition, and available provincial solar incentives.
              </p>
              <Link href="/quick-estimate" className="text-maple-600 font-semibold hover:underline">
                Get Quick Estimate →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg p-6 border border-sky-100">
              <h3 className="text-xl font-bold text-sky-700 mb-3">
                <Link href="/how-it-works" className="hover:underline">How Solar Works</Link>
              </h3>
              <p className="text-gray-600 mb-4">
                Learn how solar panel systems work, understand renewable energy generation, and discover how to maximize your solar energy savings in Canada.
              </p>
              <Link href="/how-it-works" className="text-sky-600 font-semibold hover:underline">
                Learn More →
              </Link>
            </div>
          </div>

          <div className="mt-12 bg-forest-50 rounded-lg p-8 border-2 border-forest-200">
            <h3 className="text-2xl font-bold text-forest-700 mb-4">Solar Rebates FAQ</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-forest-600 mb-2">More Solar Questions?</h4>
                <p className="text-gray-700 mb-4">
                  Check our comprehensive <Link href="/faqs" className="text-forest-600 font-semibold hover:underline">solar FAQs</Link> for detailed answers about solar installation, rebates, and energy savings.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-forest-600 mb-2">Need Professional Help?</h4>
                <p className="text-gray-700 mb-4">
                  Our <Link href="/for-installers" className="text-forest-600 font-semibold hover:underline">installer directory</Link> lists certified solar professionals who can guide you through available federal solar tax credits and local incentives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
