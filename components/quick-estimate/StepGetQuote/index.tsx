'use client'

// Step 4: Get Quote (Contact Form)
// Final step to capture contact info and submit lead

import { useState } from 'react'
import { User, Phone, MessageSquare, Loader2, CheckCircle, Camera, Upload, X } from 'lucide-react'
import type { QuickEstimateData } from '@/app/quick-estimate/page'

interface StepGetQuoteProps {
  data: QuickEstimateData
  onComplete: (data: Partial<QuickEstimateData>) => void
  onBack?: () => void
  onSubmit?: () => void
}

export function StepGetQuote({ data, onComplete, onBack, onSubmit }: StepGetQuoteProps) {
  const [fullName, setFullName] = useState(data.fullName || '')
  const [phone, setPhone] = useState(data.phone || '')
  const [comments, setComments] = useState(data.comments || '')
  const [consent, setConsent] = useState(data.consent || false)
  const [photos, setPhotos] = useState<any[]>(data.photos || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos = [...photos]
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Photos must be under 10MB')
        continue
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        newPhotos.push({
          file,
          preview: reader.result as string,
          name: file.name,
        })
        setPhotos([...newPhotos])
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    setPhotos(newPhotos)
  }

  // Format phone number
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  // Validate form
  const isValid = () => {
    if (!fullName.trim()) return false
    if (!phone || phone.replace(/\D/g, '').length < 10) return false
    if (!consent) return false
    return true
  }

  // Handle submit
  const handleSubmit = async () => {
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    if (!consent) {
      setError('Please agree to be contacted')
      return
    }

    setLoading(true)

    try {
      // Upload photos first if any
      const uploadedPhotoUrls: string[] = []
      for (const photo of photos) {
        if (photo.preview) {
          try {
            const uploadResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: photo.preview,
                filename: photo.name,
              }),
            })
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()
              if (uploadResult.url) {
                uploadedPhotoUrls.push(uploadResult.url)
              }
            }
          } catch (err) {
            console.error('Photo upload error:', err)
          }
        }
      }

      // Submit lead
      const response = await fetch('/api/quick-estimate-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Contact info
          fullName,
          email: data.email,
          phone: phone.replace(/\D/g, ''),
          comments,
          consent,

          // Location
          address: data.address,
          coordinates: data.coordinates,
          city: data.city,
          province: data.province,

          // Property
          roofAreaSqft: data.roofAreaSqft,
          roofSizePreset: data.roofSizePreset,
          shadingLevel: data.shadingLevel,
          roofOrientation: data.roofOrientation,
          roofAzimuth: data.roofAzimuth,

          // Energy
          monthlyBill: data.monthlyBill,
          annualUsageKwh: data.annualUsageKwh,

          // Estimate
          estimate: data.estimate,

          // Photos
          photoUrls: uploadedPhotoUrls,

          // Meta
          source: 'quick_estimate',
          programType: 'quick',
          estimatorMode: 'quick',
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to submit')
      }

      setSuccess(true)
      onComplete({
        fullName,
        phone,
        comments,
        consent,
        photos: uploadedPhotoUrls.map(url => ({ url })),
      })
      onSubmit?.()
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-navy-500 mb-4">
            Thank You!
          </h1>
          <p className="text-gray-600 mb-2">
            Your quote request has been submitted successfully.
          </p>
          <p className="text-gray-600 mb-8">
            We've sent a copy to <strong>{data.email}</strong>
          </p>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-navy-500 mb-4">Your Estimate Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">System Size</p>
                <p className="font-medium">{data.estimate?.systemSizeKw} kW</p>
              </div>
              <div>
                <p className="text-gray-500">Est. Cost</p>
                <p className="font-medium">${data.estimate?.netCost?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Annual Savings</p>
                <p className="font-medium">${data.estimate?.annualSavings?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Payback</p>
                <p className="font-medium">{data.estimate?.paybackYears} years</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            One of our solar specialists will contact you within 24 hours.
          </p>

          <a
            href="/"
            className="btn-primary inline-block"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">
            Get Your Free Quote
          </h1>
          <p className="text-gray-600">
            Complete your details to receive your personalized solar quote
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(416) 555-1234"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={data.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Photos (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Photos (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload photos of your roof and electrical panel to help us provide a more accurate quote
            </p>

            {/* Photo preview */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={photo.preview || photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
              <Camera className="text-gray-400" size={20} />
              <span className="text-sm text-gray-600">Add Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400" size={20} />
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any questions or specific requirements?"
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <label htmlFor="consent" className="text-sm text-gray-600">
              I agree to be contacted by a solar specialist regarding my quote.
              I understand my information will be handled according to the{' '}
              <a href="/privacy" className="text-red-500 hover:underline">Privacy Policy</a>.
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isValid()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Submitting...
                </>
              ) : (
                'Submit Quote Request'
              )}
            </button>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-500 text-center">
            Your information is secure and never shared with third parties
          </p>
        </div>
      </div>
    </div>
  )
}
