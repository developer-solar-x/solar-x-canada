'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MapPin, Sun, TrendingUp, Calculator as CalculatorIcon } from 'lucide-react'
import Link from 'next/link'

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

      <Footer />
    </main>
  )
}
