'use client'

// Installer service areas management page

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MapPin, Plus, X, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ServiceArea {
  id: string
  province: string
  description: string
  postalCodes?: string[]
  radius?: number
  radiusFrom?: string
}

export default function ServiceAreasPage() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([
    {
      id: 'area-1',
      province: 'Ontario',
      description: 'Greater Toronto Area, Mississauga, Brampton, and surrounding regions',
      postalCodes: ['M', 'L'],
      radius: 50,
      radiusFrom: 'Toronto',
    },
    {
      id: 'area-2',
      province: 'Alberta',
      description: 'Calgary and surrounding areas',
      radius: 100,
      radiusFrom: 'Calgary',
    },
  ])

  const [isAdding, setIsAdding] = useState(false)
  const [newArea, setNewArea] = useState<Partial<ServiceArea>>({
    province: '',
    description: '',
  })

  const provinces = [
    'Ontario',
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Nova Scotia',
    'Northwest Territories',
    'Nunavut',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
  ]

  const handleAddArea = () => {
    if (newArea.province && newArea.description) {
      setServiceAreas([
        ...serviceAreas,
        {
          id: `area-${Date.now()}`,
          province: newArea.province,
          description: newArea.description,
          postalCodes: [],
          radius: newArea.radius,
          radiusFrom: newArea.radiusFrom,
        },
      ])
      setNewArea({ province: '', description: '' })
      setIsAdding(false)
    }
  }

  const handleDeleteArea = (id: string) => {
    setServiceAreas(serviceAreas.filter(area => area.id !== id))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/for-installers/dashboard" 
            className="text-white/80 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold font-display">Service Areas</h1>
          <p className="text-white/90 mt-2">Define where you provide installation services</p>
        </div>
      </section>

      {/* Service Areas Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Service Areas</h2>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="btn-primary"
              >
                <Plus size={18} className="mr-2" />
                Add Service Area
              </button>
            </div>

            {/* Add New Area Form */}
            {isAdding && (
              <div className="bg-sky-50 rounded-lg p-6 mb-6 border border-sky-200">
                <h3 className="font-bold text-gray-900 mb-4">Add New Service Area</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Province *
                    </label>
                    <select
                      value={newArea.province || ''}
                      onChange={(e) => setNewArea({ ...newArea, province: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Service Area Description *
                    </label>
                    <textarea
                      value={newArea.description || ''}
                      onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                      rows={3}
                      placeholder="e.g., Greater Toronto Area, Mississauga, Brampton, and surrounding regions within 50km radius"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Service Radius (km)
                      </label>
                      <input
                        type="number"
                        value={newArea.radius || ''}
                        onChange={(e) => setNewArea({ ...newArea, radius: parseInt(e.target.value) || undefined })}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Radius From (City/Postal Code)
                      </label>
                      <input
                        type="text"
                        value={newArea.radiusFrom || ''}
                        onChange={(e) => setNewArea({ ...newArea, radiusFrom: e.target.value })}
                        placeholder="e.g., Toronto"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddArea}
                      className="btn-primary"
                    >
                      <Save size={18} className="mr-2" />
                      Add Area
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false)
                        setNewArea({ province: '', description: '' })
                      }}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Service Areas List */}
            <div className="space-y-4">
              {serviceAreas.map((area) => (
                <div
                  key={area.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-forest-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-forest-500" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{area.province}</h3>
                        <p className="text-gray-700">{area.description}</p>
                        {area.radius && area.radiusFrom && (
                          <p className="text-sm text-gray-600 mt-2">
                            Service radius: {area.radius}km from {area.radiusFrom}
                          </p>
                        )}
                        {area.postalCodes && area.postalCodes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Postal Code Prefixes:</p>
                            <div className="flex flex-wrap gap-2">
                              {area.postalCodes.map((code, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-semibold"
                                >
                                  {code}*
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Remove service area"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {serviceAreas.length === 0 && !isAdding && (
              <div className="text-center py-12">
                <MapPin className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-600 mb-4">No service areas defined yet.</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="btn-primary"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your First Service Area
                </button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-sky-50 rounded-xl p-6 border border-sky-200">
            <h3 className="font-bold text-gray-900 mb-2">How Service Areas Work</h3>
            <p className="text-gray-700 text-sm mb-2">
              Your service areas determine which leads you'll receive. Homeowners in your defined service areas will see you as a potential installer match.
            </p>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Define service areas by province and description</li>
              <li>Optionally specify a radius from a central location</li>
              <li>You can add multiple service areas across different provinces</li>
              <li>Leads are matched based on your service area coverage</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

