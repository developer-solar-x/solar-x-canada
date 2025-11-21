'use client'

// Installer application success page

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckCircle, Mail, Clock, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'

function InstallerApplicationSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [applicationData, setApplicationData] = useState<any>(null)
  const applicationId = searchParams.get('applicationId')

  useEffect(() => {
    if (applicationId) {
      // Try to get from sessionStorage
      const stored = sessionStorage.getItem('installerApplication')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (data.id === applicationId) {
            setApplicationData(data)
            return
          }
        } catch (err) {
          console.error('Error parsing application data:', err)
        }
      }
    }
  }, [applicationId])

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Success Section */}
      <section className="pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Thank you for applying to join our installer network. We've received your application and will review it shortly.
            </p>

            {applicationId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-600 mb-1">Application ID</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{applicationId}</p>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-sky-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-sky-600" size={24} />
                What Happens Next?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Document Review</h3>
                    <p className="text-gray-600 text-sm">
                      Our team will review all submitted documents, verify certifications and insurance, and check your business credentials.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Quality Assessment</h3>
                    <p className="text-gray-600 text-sm">
                      We'll review your past projects, customer references, and ensure you meet our quality and service standards.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Decision & Notification</h3>
                    <p className="text-gray-600 text-sm">
                      You'll receive an email notification within 2-3 business days with our decision and next steps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-forest-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="text-forest-600" size={24} />
                <h3 className="text-lg font-bold text-forest-600">Review Timeline</h3>
              </div>
              <p className="text-gray-700">
                Typical review time: <strong>2-3 business days</strong>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                We'll notify you via email at <strong>{applicationData?.data?.contactEmail || 'your provided email'}</strong> once the review is complete.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/for-installers/apply/status?applicationId=${applicationId || ''}`}
                className="btn-primary inline-flex items-center justify-center"
              >
                Check Application Status
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="/for-installers"
                className="btn-outline inline-flex items-center justify-center"
              >
                Back to Installer Info
              </Link>
            </div>

            {/* Contact Support */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Have questions about your application?
              </p>
              <Link
                href="/contact"
                className="text-forest-600 hover:text-forest-700 font-semibold inline-flex items-center gap-2"
              >
                <Mail size={18} />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function InstallerApplicationSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <Header />
        <section className="pt-32 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <InstallerApplicationSuccessContent />
    </Suspense>
  )
}

