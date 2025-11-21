'use client'

// Installer profile/account page

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Award, 
  Shield, 
  FileText,
  Upload,
  CheckCircle,
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function InstallerProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  
  // Mock data - will be replaced with real data when backend is connected
  const [profileData, setProfileData] = useState({
    companyName: 'Solar Solutions Inc.',
    contactPersonName: 'John Smith',
    contactEmail: 'john@solarsolutions.ca',
    contactPhone: '(416) 555-0123',
    websiteUrl: 'https://www.solarsolutions.ca',
    yearsInBusiness: '5+ years',
    primaryServiceProvinces: ['Ontario', 'Alberta'],
    serviceAreaDescription: 'Greater Toronto Area, Mississauga, Brampton, and surrounding regions within 50km radius',
  })

  const [certifications] = useState([
    {
      type: 'ESA Certification',
      number: 'ESA-12345',
      expiryDate: '2025-12-31',
      verified: true,
      documentUrl: '#',
    },
    {
      type: 'Tesla Certified Installer',
      number: 'TES-789',
      expiryDate: '2026-06-30',
      verified: true,
      documentUrl: '#',
    },
    {
      type: 'Enphase Certified',
      number: 'ENP-456',
      expiryDate: '2025-09-15',
      verified: true,
      documentUrl: '#',
    },
  ])

  const [insurance] = useState({
    generalLiabilityCoverage: '$2,000,000',
    expiryDate: '2025-03-31',
    verified: true,
    documentUrl: '#',
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/for-installers/dashboard" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold font-display">Company Profile</h1>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isEditing ? (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit size={18} className="mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="text-forest-500" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Company Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.companyName}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contact Person
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.contactPersonName}
                          onChange={(e) => setProfileData({ ...profileData, contactPersonName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.contactPersonName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Years in Business
                      </label>
                      {isEditing ? (
                        <select
                          value={profileData.yearsInBusiness}
                          onChange={(e) => setProfileData({ ...profileData, yearsInBusiness: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        >
                          <option value="1-3 years">1-3 years</option>
                          <option value="3-5 years">3-5 years</option>
                          <option value="5+ years">5+ years</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profileData.yearsInBusiness}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.contactEmail}
                        onChange={(e) => setProfileData({ ...profileData, contactEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        {profileData.contactEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.contactPhone}
                        onChange={(e) => setProfileData({ ...profileData, contactPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        {profileData.contactPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={profileData.websiteUrl}
                        onChange={(e) => setProfileData({ ...profileData, websiteUrl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Globe size={16} className="text-gray-400" />
                        <a href={profileData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-forest-600 hover:text-forest-700">
                          {profileData.websiteUrl}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Areas */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-forest-500" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Service Areas</h2>
                  </div>
                  <Link
                    href="/for-installers/dashboard/service-areas"
                    className="text-forest-600 hover:text-forest-700 font-semibold text-sm"
                  >
                    Manage Areas →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Service Provinces
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileData.primaryServiceProvinces.map((province, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold"
                        >
                          {province}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Service Area Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profileData.serviceAreaDescription}
                        onChange={(e) => setProfileData({ ...profileData, serviceAreaDescription: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.serviceAreaDescription}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Award className="text-forest-500" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                  </div>
                  <button className="btn-outline text-sm">
                    <Upload size={16} className="mr-2" />
                    Add Certification
                  </button>
                </div>
                
                <div className="space-y-4">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{cert.type}</h3>
                          <p className="text-sm text-gray-600">Number: {cert.number}</p>
                        </div>
                        {cert.verified && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                            <CheckCircle size={12} />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </span>
                        <a href={cert.documentUrl} className="text-forest-600 hover:text-forest-700 flex items-center gap-1">
                          <FileText size={14} />
                          View Document
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insurance */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="text-forest-500" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Insurance</h2>
                  </div>
                  <button className="btn-outline text-sm">
                    <Upload size={16} className="mr-2" />
                    Update Insurance
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">General Liability Coverage</h3>
                      <p className="text-lg font-bold text-gray-900 mt-1">{insurance.generalLiabilityCoverage}</p>
                    </div>
                    {insurance.verified && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Expires: {new Date(insurance.expiryDate).toLocaleDateString()}
                    </span>
                    <a href={insurance.documentUrl} className="text-forest-600 hover:text-forest-700 flex items-center gap-1">
                      <FileText size={14} />
                      View Proof
                    </a>
                  </div>
                  {new Date(insurance.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Insurance expires within 90 days. Please renew to maintain active status.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-sm text-gray-700">Active Account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-sm text-gray-700">All Documents Verified</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Member Since</p>
                    <p className="font-semibold text-gray-900">January 2024</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-sky-50 rounded-xl p-6 border border-sky-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/for-installers/dashboard" className="text-sm text-forest-600 hover:text-forest-700 block">
                    Dashboard
                  </Link>
                  <Link href="/for-installers/dashboard/leads" className="text-sm text-forest-600 hover:text-forest-700 block">
                    View Leads
                  </Link>
                  <Link href="/for-installers/dashboard/service-areas" className="text-sm text-forest-600 hover:text-forest-700 block">
                    Service Areas
                  </Link>
                  <Link href="/for-installers/help" className="text-sm text-forest-600 hover:text-forest-700 block">
                    Help & Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

