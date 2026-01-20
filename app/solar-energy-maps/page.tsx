'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MapPin, Sun, TrendingUp, Calculator as CalculatorIcon, Zap, Database, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SolarEnergyMapsPage() {
  const provinces = [
    {
      name: 'Ontario',
      code: 'ON',
      solarPotential: 'High',
      avgSunHours: '1,200-1,400',
      description: 'Excellent solar potential with good year-round sunlight. Cold winters actually improve panel efficiency.',
    },
    {
      name: 'Alberta',
      code: 'AB',
      solarPotential: 'Very High',
      avgSunHours: '1,400-1,600',
      description: 'One of the best solar potentials in Canada. High altitude and clear skies maximize solar production.',
    },
    {
      name: 'British Columbia',
      code: 'BC',
      solarPotential: 'Moderate to High',
      avgSunHours: '1,000-1,300',
      description: 'Varies by region. Interior BC has excellent potential, while coastal areas have more cloud cover.',
    },
    {
      name: 'Saskatchewan',
      code: 'SK',
      solarPotential: 'Very High',
      avgSunHours: '1,400-1,600',
      description: 'Excellent solar conditions with long sunny days and minimal cloud cover.',
    },
    {
      name: 'Manitoba',
      code: 'MB',
      solarPotential: 'High',
      avgSunHours: '1,200-1,400',
      description: 'Good solar potential with consistent sunlight throughout the year.',
    },
    {
      name: 'Quebec',
      code: 'QC',
      solarPotential: 'Moderate to High',
      avgSunHours: '1,000-1,300',
      description: 'Solar potential varies by region. Southern Quebec has better conditions than northern areas.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Solar Energy Maps
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Explore solar energy potential across Canada by province and region
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-lg mb-6">Solar Potential Across Canada</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Canada has excellent solar potential, with many provinces receiving more annual sunlight than Germany, one of the world's leading solar markets. Solar panels actually perform better in cooler temperatures, making Canada's climate ideal for solar energy production.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Solar potential varies by province and region based on factors like latitude, cloud cover, and seasonal weather patterns. Understanding your region's solar potential helps you make informed decisions about system sizing and expected production.
              </p>
              <div className="bg-sky-50 rounded-lg p-6 border-l-4 border-sky-500">
                <div className="flex items-start gap-3">
                  <CalculatorIcon className="text-sky-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-gray-700 text-sm">
                    <strong>Get location-specific estimates:</strong> Our calculator uses satellite data and local weather patterns to provide accurate production estimates for your exact location.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-forest-50 to-sky-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sun className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-forest-500 mb-2">Sun Hours</h3>
                    <p className="text-gray-600 text-sm">
                      Most Canadian provinces receive 1,000-1,600 annual sun hours, comparable to major solar markets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-maple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="text-maple-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-maple-500 mb-2">Cooler = Better</h3>
                    <p className="text-gray-600 text-sm">
                      Solar panels are more efficient in cooler temperatures, making Canada's climate ideal
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-sky-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-500 mb-2">Location Matters</h3>
                    <p className="text-gray-600 text-sm">
                      Your specific location, roof orientation, and shading all affect solar production
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provincial Data Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Solar Potential by Province</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Regional solar energy data and potential
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {provinces.map((province, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-forest-500">{province.name}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-forest-100 text-forest-700 font-semibold">
                    {province.code}
                  </span>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Solar Potential:</span>
                    <span className={`ml-2 font-semibold ${
                      province.solarPotential === 'Very High' ? 'text-green-600' :
                      province.solarPotential === 'High' ? 'text-forest-500' :
                      'text-amber-600'
                    }`}>
                      {province.solarPotential}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Avg. Sun Hours/Year:</span>
                    <span className="ml-2 font-semibold text-gray-800">{province.avgSunHours}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{province.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Map Note */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sky-50 to-forest-50 rounded-2xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-forest-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="text-forest-500" size={32} />
            </div>
            <h2 className="heading-lg mb-4">Location-Specific Solar Estimates</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our calculator uses satellite imagery and local weather data to provide accurate solar production estimates for your exact address. Get personalized results based on your roof orientation, shading, and local climate.
            </p>
            <Link
              href="/estimator"
              className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
            >
              Get Your Location-Specific Estimate
            </Link>
          </div>
        </div>
      </section>

      {/* Photovoltaic Potential Maps Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Photovoltaic Potential and Solar Resource Maps of Canada</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Annual south-facing latitude map tilt and detailed solar resource estimates across the country
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              This web mapping application gives estimates of <strong>photovoltaic potential</strong> (in kWh/kWp) and <strong>mean daily global insolation</strong> (in MJ/m² and kWh/m²) for any location in Canada on a 60 arc seconds (~2 km) grid.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The photovoltaic (PV) potential represents the expected lifetime average electricity production (in kWh) produced per kilowatt of installed photovoltaic DC capacity rated at Standard Test Conditions (STC) for grid-connected PV systems without batteries.
            </p>
          </div>

          {/* Annual South-facing Map Image */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Annual South-facing Latitude Tilt</h3>
            <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
              <Image
                src="/Annual South-facing Latitude Tilt (1).webp"
                alt="Annual South-facing Latitude Tilt Map of Canada"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              © Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources, 2020
            </p>
          </div>

          {/* Array Orientations */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Map Coverage</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Monthly and annual averages</li>
                <li>✓ Six different PV array orientations</li>
                <li>✓ Sun-tracking orientation</li>
                <li>✓ Horizontal orientation</li>
                <li>✓ Four fixed South-facing orientations</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">South-facing Fixed Tilt Options</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Latitude tilt (optimal angle)</li>
                <li>✓ Vertical (90°)</li>
                <li>✓ Latitude + 15°</li>
                <li>✓ Latitude – 15°</li>
                <li>✓ 3500+ municipality data points</li>
              </ul>
            </div>
          </div>

          <div className="bg-sky-50 border-l-4 border-sky-500 rounded-lg p-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              Data can be obtained directly for individual municipalities from a list of over 3,500 municipalities or downloaded for all municipalities at once. Maps are presented for each month and for the entire year.
            </p>
          </div>
        </div>
      </section>

      {/* Data Sources and Methodology */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Methodology and Data Sources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Rigorous scientific foundation for solar resource estimates
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-forest-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-forest-500" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Data Source</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-3 leading-relaxed">
                <li><strong>Historical Period:</strong> 1974-1993 (CERES, Environment and Climate Change Canada)</li>
                <li><strong>Ground Stations:</strong> 144 meteorological stations across Canada</li>
                <li><strong>Alaska Data:</strong> 8 additional stations (US National Solar Radiation Database, 1961-1990) for regional modeling</li>
                <li><strong>Interpolation:</strong> Thin-plate smoothing splines (ANUSPLIN model)</li>
                <li><strong>Grid Resolution:</strong> 60 arc seconds (~2 km)</li>
                <li><strong>Model Variables:</strong> Position, precipitation, and monthly mean daily global insolation</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="text-amber-600" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Performance Ratio</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                PV potential was estimated using a <strong>0.75 performance ratio</strong>, which accounts for overall system losses from:
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>• Non-ideal climatic factors</li>
                <li>• Inverter operation losses</li>
                <li>• Wiring and component losses</li>
                <li>• Temperature derating effects</li>
                <li>• Dust, snow, and shading</li>
              </ul>
              <p className="text-xs text-gray-600 italic">
                Represents lifetime average STC-rated DC to AC output for grid-connected systems.
              </p>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Solar Resource Uncertainty</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>Two key uncertainty metrics:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>RTGCV:</strong> 0.5% to 5.3% (conservative estimate)</li>
                  <li><strong>RTMSE:</strong> 0.2% to 2.4% (root mean square error)</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">True error typically lies between RTMSE and RTGCV; varies by PV array orientation.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Photovoltaic Potential Accuracy</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Lifetime Annual Estimates:</strong> Within ~10% accuracy</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Well-functioning systems: 0.75–0.9 annual PR initially</li>
                  <li>Degradation: ~0.6% per year over 25+ year lifespan</li>
                  <li>Initial performance typically exceeds lifetime average</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2"><strong>Monthly values:</strong> Indicative only; exclude temperature, snowfall, and interannual variability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners and Credits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Development Partners</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Collaborative effort across Canadian government research institutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-forest-500/10 rounded flex items-center justify-center">
                  <Sun className="text-forest-500" size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Canadian Forest Service</h3>
              </div>
              <p className="text-sm text-gray-600">Great Lakes Forestry Centre – primary development</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-sky-500/10 rounded flex items-center justify-center">
                  <Zap className="text-sky-500" size={20} />
                </div>
                <h3 className="font-bold text-gray-900">CanmetENERGY</h3>
              </div>
              <p className="text-sm text-gray-600">Renewable Energy Integration group collaboration</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-maple-500/10 rounded flex items-center justify-center">
                  <MapPin className="text-maple-500" size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Federal Geospatial Platform</h3>
              </div>
              <p className="text-sm text-gray-600">Insolation data by Environment and Climate Change Canada</p>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
            <p className="text-gray-800 text-sm leading-relaxed">
              <strong>Citation:</strong> © Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources, 2020. Any reproduction or public use of these maps or datasets should include this attribution.
            </p>
          </div>
        </div>
      </section>

      {/* References */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Scientific References</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Peer-reviewed methodology and technical details
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">Methodology Overview</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Pelland, S., McKenney, D. W., Poissant, Y., Morris, R., Lawrence, K., Campbell, K. and Papadopol, P. 2006. 
                <em>The Development of Photovoltaic Resource Maps for Canada</em>, In Proceedings of the Annual Conference of the 
                Solar Energy Society of Canada (SESCI) 2006.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">Detailed Scientific Article</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                McKenney D. W., Pelland S., Poissant Y., Morris R., Hutchinson M, Papadopol P., Lawrence K. and Campbell K., 2008. 
                <em>Spatial insolation models for photovoltaic energy in Canada</em>, Solar Energy 82, pp. 1049–1061.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-forest-50 to-sky-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Ready to Explore Your Solar Potential?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our estimator combines these scientific maps with satellite imagery and local weather data for hyper-localized solar production forecasts.
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
