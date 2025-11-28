'use client'

// Estimate tracking page - allows users to check their estimate by entering tracking ID

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Search, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function EstimateTrackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!trackingId.trim()) {
      setError('Please enter your tracking ID')
      return
    }

    setLoading(true)
    
    try {
      // Check if the estimate exists by fetching from API
      const response = await fetch(`/api/leads/${trackingId.trim()}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.lead) {
          // Redirect to the tracking page with the ID
          router.push(`/track/${trackingId.trim()}`)
        } else {
          setError('Estimate not found. Please check your tracking ID and try again.')
        }
      } else {
        setError('Estimate not found. Please check your tracking ID and try again.')
      }
    } catch (err) {
      console.error('Error checking estimate:', err)
      setError('Unable to check estimate. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-forest-500 to-forest-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Track Your Solar Estimate
          </h1>
          <p className="text-xl text-white/90">
            Enter your tracking ID to view your solar savings estimate results
          </p>
        </div>
      </section>

      {/* Tracking Form Section */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-forest-100 to-forest-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <FileText className="text-forest-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enter Your Tracking ID
              </h2>
              <p className="text-gray-600">
                You received this ID when you completed your solar estimate
              </p>
            </div>

            {loading ? (
              <div className="space-y-6">
                <div className="bg-white border-2 border-forest-200 rounded-xl p-12 text-center">
                  <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="text-forest-500 animate-spin" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Loading Your Estimate
                  </h3>
                  <p className="text-gray-600">
                    Please wait while we retrieve your estimate information...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="trackingId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tracking ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="text-gray-400" size={20} />
                    </div>
                    <input
                      type="text"
                      id="trackingId"
                      value={trackingId}
                      onChange={(e) => {
                        setTrackingId(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter your tracking ID"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-all text-lg font-mono"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertCircle size={16} />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary h-14 text-lg inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="mr-2" size={20} />
                  View My Estimate
                </button>
              </form>
            )}

            {/* Help Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-sky-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="text-sky-600" size={20} />
                  Can't find your Tracking ID?
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Check your email inbox for the confirmation email</li>
                  <li>• Look at the results page URL after completing your estimate</li>
                  <li>• Check your browser's saved data or bookmarks</li>
                  <li>• Contact our support team for assistance</li>
                </ul>
                <div className="mt-4">
                  <span className="text-forest-600 hover:text-forest-700 font-semibold text-sm inline-flex items-center gap-1 cursor-default">
                    Contact Support
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/estimator"
                className="btn-outline text-center flex-1"
              >
                Start New Estimate
              </Link>
              <Link
                href="/"
                className="btn-outline text-center flex-1"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function EstimateTrackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <Header />
        <section className="pt-32 pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <EstimateTrackContent />
    </Suspense>
  )
}

