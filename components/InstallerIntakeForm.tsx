'use client'

// Installer intake form component - comprehensive form for installer applications

import { useState, FormEvent, ChangeEvent } from 'react'
import { Building2, User, Mail, Phone, Globe, Calendar, Award, Shield, FileText, Upload, CheckCircle, AlertCircle, X } from 'lucide-react'

interface InstallerIntakeFormProps {
  onSubmit: (data: InstallerFormData) => void
  onCancel?: () => void
}

export interface InstallerFormData {
  // Company Information
  companyName: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  websiteUrl: string
  yearsInBusiness: string
  primaryServiceProvinces: string[]
  serviceAreaDescription: string
  
  // Certifications (file uploads)
  certifications: {
    esa: File | null
    provincial: File | null
    manufacturer: { name: string; file: File | null }[]
    other: File | null
    otherDescription: string
  }
  
  // Insurance
  generalLiabilityCoverage: string
  insuranceProof: File | null
  
  // Experience
  numberOfInstalls: string
  typicalSystemSizeRange: string
  projectPhotos: File[]
  
  // Warranty
  workmanshipWarrantyYears: string
  productWarrantySupport: string
  
  // Agreement
  agreeToVetting: boolean
  agreeToDoubleWarranty: boolean
}

export function InstallerIntakeForm({ onSubmit, onCancel }: InstallerIntakeFormProps) {
  const [formData, setFormData] = useState<InstallerFormData>({
    companyName: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    yearsInBusiness: '',
    primaryServiceProvinces: [],
    serviceAreaDescription: '',
    certifications: {
      esa: null,
      provincial: null,
      manufacturer: [],
      other: null,
      otherDescription: '',
    },
    generalLiabilityCoverage: '',
    insuranceProof: null,
    numberOfInstalls: '',
    typicalSystemSizeRange: '',
    projectPhotos: [],
    workmanshipWarrantyYears: '',
    productWarrantySupport: '',
    agreeToVetting: false,
    agreeToDoubleWarranty: false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InstallerFormData | 'submit', string>>>({})
  const [loading, setLoading] = useState(false)
  const [currentSection, setCurrentSection] = useState(1)

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

  const manufacturerOptions = [
    'Tesla',
    'Enphase',
    'Other',
  ]

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked,
      })
    } else if (name === 'certifications.otherDescription') {
      setFormData({
        ...formData,
        certifications: {
          ...formData.certifications,
          otherDescription: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
    // Clear error
    if (errors[name as keyof InstallerFormData]) {
      setErrors({ ...errors, [name]: undefined })
    }
  }

  const handleProvinceToggle = (province: string) => {
    setFormData({
      ...formData,
      primaryServiceProvinces: formData.primaryServiceProvinces.includes(province)
        ? formData.primaryServiceProvinces.filter(p => p !== province)
        : [...formData.primaryServiceProvinces, province],
    })
  }

  const handleCertificationUpload = (e: ChangeEvent<HTMLInputElement>, certType: 'esa' | 'provincial' | 'other') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setFormData({
      ...formData,
      certifications: {
        ...formData.certifications,
        [certType]: files[0],
      },
    })
  }

  const handleManufacturerCertUpload = (e: ChangeEvent<HTMLInputElement>, manufacturer: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const existingIndex = formData.certifications.manufacturer.findIndex(m => m.name === manufacturer)
    const updatedManufacturer = [...formData.certifications.manufacturer]

    if (existingIndex >= 0) {
      updatedManufacturer[existingIndex] = { name: manufacturer, file: files[0] }
    } else {
      updatedManufacturer.push({ name: manufacturer, file: files[0] })
    }

    setFormData({
      ...formData,
      certifications: {
        ...formData.certifications,
        manufacturer: updatedManufacturer,
      },
    })
  }

  const removeManufacturerCert = (manufacturer: string) => {
    setFormData({
      ...formData,
      certifications: {
        ...formData.certifications,
        manufacturer: formData.certifications.manufacturer.filter(m => m.name !== manufacturer),
      },
    })
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, field: 'insuranceProof' | 'projectPhotos') => {
    const files = e.target.files
    if (!files) return

    if (field === 'insuranceProof') {
      setFormData({ ...formData, insuranceProof: files[0] })
    } else {
      setFormData({ ...formData, projectPhotos: Array.from(files) })
    }
  }

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      projectPhotos: formData.projectPhotos.filter((_, i) => i !== index),
    })
  }

  const validateSection = (section: number): boolean => {
    const newErrors: Partial<Record<keyof InstallerFormData, string>> = {}

    if (section === 1) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
      if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Contact person name is required'
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address'
      }
      if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone number is required'
      if (!formData.yearsInBusiness) newErrors.yearsInBusiness = 'Years in business is required'
      if (formData.primaryServiceProvinces.length === 0) {
        newErrors.primaryServiceProvinces = 'Please select at least one service province'
      }
    }

    if (section === 2) {
      // ESA / Provincial certifications are optional
      if (!formData.generalLiabilityCoverage.trim()) {
        newErrors.generalLiabilityCoverage = 'General liability coverage amount is required'
      }
      if (!formData.insuranceProof) {
        newErrors.insuranceProof = 'Proof of insurance is required'
      }
    }

    if (section === 3) {
      if (!formData.numberOfInstalls.trim()) newErrors.numberOfInstalls = 'Number of installs is required'
      if (!formData.typicalSystemSizeRange.trim()) {
        newErrors.typicalSystemSizeRange = 'Typical system size range is required'
      }
    }

    if (section === 4) {
      if (!formData.workmanshipWarrantyYears.trim()) {
        newErrors.workmanshipWarrantyYears = 'Workmanship warranty length is required'
      }
      if (!formData.agreeToVetting) {
        newErrors.agreeToVetting = 'You must agree to the vetting process'
      }
      if (!formData.agreeToDoubleWarranty) {
        newErrors.agreeToDoubleWarranty = 'You must agree to the double warranty framework'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentSection(currentSection - 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateSection(4)) {
      return
    }

    setLoading(true)
    
    try {
      // Create FormData for API submission
      const submitFormData = new FormData()
      
      // Add text fields
      submitFormData.append('companyName', formData.companyName)
      submitFormData.append('contactPersonName', formData.contactPersonName)
      submitFormData.append('contactEmail', formData.contactEmail)
      submitFormData.append('contactPhone', formData.contactPhone)
      submitFormData.append('websiteUrl', formData.websiteUrl || '')
      submitFormData.append('yearsInBusiness', formData.yearsInBusiness || '')
      submitFormData.append('primaryServiceProvinces', JSON.stringify(formData.primaryServiceProvinces))
      submitFormData.append('serviceAreaDescription', formData.serviceAreaDescription || '')
      submitFormData.append('generalLiabilityCoverage', formData.generalLiabilityCoverage || '')
      submitFormData.append('numberOfInstalls', formData.numberOfInstalls || '')
      submitFormData.append('typicalSystemSizeRange', formData.typicalSystemSizeRange || '')
      submitFormData.append('workmanshipWarrantyYears', formData.workmanshipWarrantyYears || '')
      submitFormData.append('productWarrantySupport', formData.productWarrantySupport || '')
      submitFormData.append('certificationOtherDescription', formData.certifications.otherDescription || '')
      submitFormData.append('agreeToVetting', String(formData.agreeToVetting))
      submitFormData.append('agreeToDoubleWarranty', String(formData.agreeToDoubleWarranty))
      
      // Add certification files
      if (formData.certifications.esa) {
        submitFormData.append('certificationEsa', formData.certifications.esa)
      }
      if (formData.certifications.provincial) {
        submitFormData.append('certificationProvincial', formData.certifications.provincial)
      }
      if (formData.certifications.other) {
        submitFormData.append('certificationOther', formData.certifications.other)
      }
      
      // Add manufacturer certifications
      const manufacturerNames = formData.certifications.manufacturer.map(m => m.name)
      submitFormData.append('manufacturerNames', JSON.stringify(manufacturerNames))
      formData.certifications.manufacturer.forEach((cert) => {
        if (cert.file) {
          submitFormData.append(`manufacturerCert_${cert.name}`, cert.file)
        }
      })
      
      // Add insurance proof
      if (formData.insuranceProof) {
        submitFormData.append('insuranceProof', formData.insuranceProof)
      }
      
      // Add project photos
      formData.projectPhotos.forEach((photo) => {
        submitFormData.append('projectPhotos', photo)
      })
      
      // Submit to API
      const response = await fetch('/api/installers', {
        method: 'POST',
        body: submitFormData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }
      
      // Call the onSubmit callback with the API result (including applicationId)
      // Don't set loading to false here - let the parent handle redirect
      // The form will be unmounted when the parent redirects
      onSubmit({
        ...formData,
        applicationId: result.applicationId,
        apiResult: result,
      })
    } catch (error: any) {
      console.error('Error submitting installer application:', error)
      setErrors({ submit: error.message || 'Failed to submit application. Please try again.' })
      setLoading(false) // Only reset loading on error
    }
  }

  const sections = [
    { number: 1, title: 'Company Information' },
    { number: 2, title: 'Certifications & Insurance' },
    { number: 3, title: 'Experience' },
    { number: 4, title: 'Warranty & Agreement' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {sections.map((section) => (
              <div key={section.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentSection > section.number
                        ? 'bg-forest-500 text-white'
                        : currentSection === section.number
                        ? 'bg-maple-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentSection > section.number ? (
                      <CheckCircle size={20} />
                    ) : (
                      section.number
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center text-gray-600 hidden sm:block">
                    {section.title}
                  </span>
                </div>
                {section.number < sections.length && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentSection > section.number ? 'bg-forest-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Company Information */}
          {currentSection === 1 && (
            <div className="space-y-6">
              <h2 className="heading-md mb-6">Company Information</h2>

              <div>
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 size={16} className="inline mr-1" />
                  Company Name <span className="text-maple-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                    errors.companyName ? 'border-maple-500' : 'border-gray-300'
                  }`}
                />
                {errors.companyName && (
                  <p className="text-sm text-maple-500 mt-1">{errors.companyName}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactPersonName" className="block text-sm font-semibold text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Contact Person Name <span className="text-maple-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactPersonName"
                    name="contactPersonName"
                    required
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                      errors.contactPersonName ? 'border-maple-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactPersonName && (
                    <p className="text-sm text-maple-500 mt-1">{errors.contactPersonName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="yearsInBusiness" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Years in Business <span className="text-maple-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="yearsInBusiness"
                    name="yearsInBusiness"
                    required
                    min="1"
                    value={formData.yearsInBusiness}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                      errors.yearsInBusiness ? 'border-maple-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.yearsInBusiness && (
                    <p className="text-sm text-maple-500 mt-1">{errors.yearsInBusiness}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Contact Email <span className="text-maple-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                      errors.contactEmail ? 'border-maple-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-maple-500 mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-1" />
                    Contact Phone <span className="text-maple-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                      errors.contactPhone ? 'border-maple-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-maple-500 mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Globe size={16} className="inline mr-1" />
                  Website URL <span className="text-gray-400 text-xs">(optional but recommended)</span>
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  placeholder="https://www.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Primary Service Provinces <span className="text-maple-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {provinces.map((province) => (
                    <label
                      key={province}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.primaryServiceProvinces.includes(province)
                          ? 'border-forest-500 bg-forest-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.primaryServiceProvinces.includes(province)}
                        onChange={() => handleProvinceToggle(province)}
                        className="w-4 h-4 text-forest-500 border-gray-300 rounded focus:ring-forest-500"
                      />
                      <span className="text-sm font-medium">{province}</span>
                    </label>
                  ))}
                </div>
                {errors.primaryServiceProvinces && (
                  <p className="text-sm text-maple-500 mt-1">{errors.primaryServiceProvinces}</p>
                )}
              </div>

              <div>
                <label htmlFor="serviceAreaDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Area Description
                </label>
                <textarea
                  id="serviceAreaDescription"
                  name="serviceAreaDescription"
                  rows={4}
                  value={formData.serviceAreaDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 resize-none"
                  placeholder="Describe your service area (e.g., radius from postal codes, specific regions, etc.)"
                />
              </div>
            </div>
          )}

          {/* Section 2: Certifications & Insurance */}
          {currentSection === 2 && (
            <div className="space-y-6">
              <h2 className="heading-md mb-6">Certifications & Insurance</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Award size={16} className="inline mr-1" />
                  Certifications <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload copies of your certifications. Accepted formats: PDF, JPG, PNG (max 10MB per file)
                </p>

                <div className="space-y-4">
                  {/* ESA / Provincial Electrical Certification (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ESA / Provincial Electrical Certification <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Optional: Provincial electrical certification (ESA in Ontario, or equivalent in other provinces)
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-forest-500 transition-colors">
                      <input
                        type="file"
                        id="certifications.esa"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertificationUpload(e, 'esa')}
                        className="hidden"
                      />
                      <label htmlFor="certifications.esa" className="cursor-pointer flex items-center gap-3">
                        <Upload className="text-gray-400" size={20} />
                        <div className="flex-1">
                          {formData.certifications.esa ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900">{formData.certifications.esa.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setFormData({
                                    ...formData,
                                    certifications: { ...formData.certifications, esa: null },
                                  })
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Other Provincial Certifications (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Other Provincial Certifications <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Optional: Additional provincial or regional certifications
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-forest-500 transition-colors">
                      <input
                        type="file"
                        id="certifications.provincial"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertificationUpload(e, 'provincial')}
                        className="hidden"
                      />
                      <label htmlFor="certifications.provincial" className="cursor-pointer flex items-center gap-3">
                        <Upload className="text-gray-400" size={20} />
                        <div className="flex-1">
                          {formData.certifications.provincial ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900">{formData.certifications.provincial.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setFormData({
                                    ...formData,
                                    certifications: { ...formData.certifications, provincial: null },
                                  })
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Manufacturer Certifications */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Manufacturer Certifications
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manufacturerOptions.map((manufacturer) => {
                        const cert = formData.certifications.manufacturer.find(m => m.name === manufacturer)
                        return (
                          <div key={manufacturer} className="border border-gray-200 rounded-lg p-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {manufacturer}
                            </label>
                            {cert?.file ? (
                              <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <span className="text-xs text-gray-700 truncate flex-1">{cert.file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeManufacturerCert(manufacturer)}
                                  className="text-red-600 hover:text-red-700 ml-2"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded p-2 hover:border-forest-500 transition-colors">
                                <input
                                  type="file"
                                  id={`certifications.manufacturer.${manufacturer}`}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleManufacturerCertUpload(e, manufacturer)}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={`certifications.manufacturer.${manufacturer}`}
                                  className="cursor-pointer flex items-center gap-2 text-xs text-gray-600"
                                >
                                  <Upload size={14} />
                                  Upload certificate
                                </label>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Other Certifications */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Other Certifications
                    </label>
                    <div className="mb-2">
                      <textarea
                        id="certifications.otherDescription"
                        name="certifications.otherDescription"
                        rows={2}
                        value={formData.certifications.otherDescription}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            certifications: {
                              ...formData.certifications,
                              otherDescription: e.target.value,
                            },
                          })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 resize-none text-sm"
                        placeholder="Describe other certifications..."
                      />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-forest-500 transition-colors">
                      <input
                        type="file"
                        id="certifications.other"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertificationUpload(e, 'other')}
                        className="hidden"
                      />
                      <label htmlFor="certifications.other" className="cursor-pointer flex items-center gap-3">
                        <Upload className="text-gray-400" size={20} />
                        <div className="flex-1">
                          {formData.certifications.other ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900">{formData.certifications.other.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setFormData({
                                    ...formData,
                                    certifications: { ...formData.certifications, other: null },
                                  })
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">Upload certificate document (optional)</span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                {/* No errors for optional certifications */}
              </div>

              <div>
                <label htmlFor="generalLiabilityCoverage" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Shield size={16} className="inline mr-1" />
                  General Liability Coverage Amount <span className="text-maple-500">*</span>
                </label>
                <input
                  type="text"
                  id="generalLiabilityCoverage"
                  name="generalLiabilityCoverage"
                  required
                  value={formData.generalLiabilityCoverage}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                    errors.generalLiabilityCoverage ? 'border-maple-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., $2,000,000"
                />
                {errors.generalLiabilityCoverage && (
                  <p className="text-sm text-maple-500 mt-1">{errors.generalLiabilityCoverage}</p>
                )}
              </div>

              <div>
                <label htmlFor="insuranceProof" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  Proof of Insurance (PDF/JPG) <span className="text-maple-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest-500 transition-colors">
                  <input
                    type="file"
                    id="insuranceProof"
                    name="insuranceProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'insuranceProof')}
                    className="hidden"
                  />
                  <label htmlFor="insuranceProof" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">
                      {formData.insuranceProof
                        ? formData.insuranceProof.name
                        : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                  </label>
                </div>
                {errors.insuranceProof && (
                  <p className="text-sm text-maple-500 mt-1">{errors.insuranceProof}</p>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Experience */}
          {currentSection === 3 && (
            <div className="space-y-6">
              <h2 className="heading-md mb-6">Past Experience</h2>

              <div>
                <label htmlFor="numberOfInstalls" className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Solar Installs Completed <span className="text-maple-500">*</span>
                </label>
                <input
                  type="number"
                  id="numberOfInstalls"
                  name="numberOfInstalls"
                  required
                  min="0"
                  value={formData.numberOfInstalls}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                    errors.numberOfInstalls ? 'border-maple-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 150"
                />
                {errors.numberOfInstalls && (
                  <p className="text-sm text-maple-500 mt-1">{errors.numberOfInstalls}</p>
                )}
              </div>

              <div>
                <label htmlFor="typicalSystemSizeRange" className="block text-sm font-semibold text-gray-700 mb-2">
                  Typical System Size Range <span className="text-maple-500">*</span>
                </label>
                <input
                  type="text"
                  id="typicalSystemSizeRange"
                  name="typicalSystemSizeRange"
                  required
                  value={formData.typicalSystemSizeRange}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                    errors.typicalSystemSizeRange ? 'border-maple-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5kW - 20kW"
                />
                {errors.typicalSystemSizeRange && (
                  <p className="text-sm text-maple-500 mt-1">{errors.typicalSystemSizeRange}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sample Project Photos <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="projectPhotos"
                    name="projectPhotos"
                    accept=".jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'projectPhotos')}
                    className="hidden"
                  />
                  <label htmlFor="projectPhotos" className="cursor-pointer block text-center">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">Click to upload photos</p>
                    <p className="text-xs text-gray-500 mt-1">JPG or PNG (max 5MB each)</p>
                  </label>
                  
                  {formData.projectPhotos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.projectPhotos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-maple-500 hover:text-maple-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Warranty & Agreement */}
          {currentSection === 4 && (
            <div className="space-y-6">
              <h2 className="heading-md mb-6">Warranty & Agreement</h2>

              <div>
                <label htmlFor="workmanshipWarrantyYears" className="block text-sm font-semibold text-gray-700 mb-2">
                  Workmanship Warranty Length (Years) <span className="text-maple-500">*</span>
                </label>
                <input
                  type="number"
                  id="workmanshipWarrantyYears"
                  name="workmanshipWarrantyYears"
                  required
                  min="1"
                  value={formData.workmanshipWarrantyYears}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 ${
                    errors.workmanshipWarrantyYears ? 'border-maple-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 10"
                />
                {errors.workmanshipWarrantyYears && (
                  <p className="text-sm text-maple-500 mt-1">{errors.workmanshipWarrantyYears}</p>
                )}
              </div>

              <div>
                <label htmlFor="productWarrantySupport" className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Warranty Support
                </label>
                <textarea
                  id="productWarrantySupport"
                  name="productWarrantySupport"
                  rows={4}
                  value={formData.productWarrantySupport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 resize-none"
                  placeholder="Describe how you support product warranties (e.g., manufacturer warranty handling, replacement procedures, etc.)"
                />
              </div>

              <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-forest-500">Agreement</h3>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToVetting"
                    checked={formData.agreeToVetting}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-forest-500 border-gray-300 rounded focus:ring-forest-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the vetting process and understand that my application will be reviewed before approval. <span className="text-maple-500">*</span>
                  </span>
                </label>
                {errors.agreeToVetting && (
                  <p className="text-sm text-maple-500 ml-8">{errors.agreeToVetting}</p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToDoubleWarranty"
                    checked={formData.agreeToDoubleWarranty}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-forest-500 border-gray-300 rounded focus:ring-forest-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the double warranty framework and understand that homeowners will receive both my warranty and the platform guarantee. <span className="text-maple-500">*</span>
                  </span>
                </label>
                {errors.agreeToDoubleWarranty && (
                  <p className="text-sm text-maple-500 ml-8">{errors.agreeToDoubleWarranty}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            {currentSection > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-outline"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {currentSection < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary ml-auto"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>

          {onCancel && currentSection === 1 && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline mt-4"
            >
              Cancel
            </button>
          )}

          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

