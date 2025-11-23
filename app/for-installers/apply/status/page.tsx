'use client'

// Installer application status page

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { Logo } from '@/components/Logo'
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Mail, Phone, Building2, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type ApplicationStatus = 'pending_review' | 'approved' | 'rejected' | 'need_more_info'

interface ApplicationData {
  id: string
  data: any
  status: ApplicationStatus
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
  reviewedBy?: string
}

function InstallerApplicationStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const applicationId = searchParams.get('applicationId')

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) {
        setLoading(false)
        return
      }

      // Try to get from localStorage first
      const stored = localStorage.getItem('installerApplication')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (data.id === applicationId) {
            setApplication(data)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('Error parsing application data:', err)
        }
      }

      // Try sessionStorage
      const sessionStored = sessionStorage.getItem('installerApplication')
      if (sessionStored) {
        try {
          const data = JSON.parse(sessionStored)
          if (data.id === applicationId) {
            setApplication(data)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('Error parsing application data:', err)
        }
      }

      // Fetch from API
      try {
        const response = await fetch(`/api/installers?id=${applicationId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.application) {
            const appData = {
              id: result.application.id,
              data: {
                companyName: result.application.companyName,
                contactPersonName: result.application.contactPersonName,
                contactEmail: result.application.contactEmail,
                contactPhone: result.application.contactPhone,
                primaryServiceProvinces: result.application.primaryServiceProvinces,
                serviceAreaDescription: result.application.serviceAreaDescription,
              },
              status: result.application.status,
              submittedAt: result.application.submittedAt,
              reviewedAt: result.application.reviewedAt,
              reviewNotes: result.application.reviewNotes,
              reviewedBy: result.application.reviewedBy,
            }
            setApplication(appData)
            // Save to localStorage for future access
            localStorage.setItem('installerApplication', JSON.stringify(appData))
          }
        }
      } catch (err) {
        console.error('Error fetching application from API:', err)
      } finally {
    setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId])

  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Application Approved',
          description: 'Congratulations! Your application has been approved.',
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Application Not Approved',
          description: 'Unfortunately, your application was not approved at this time.',
        }
      case 'need_more_info':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'More Information Needed',
          description: 'We need additional information to complete your application review.',
        }
      default:
        return {
          icon: Clock,
          color: 'text-sky-600',
          bgColor: 'bg-sky-50',
          borderColor: 'border-sky-200',
          title: 'Under Review',
          description: 'Your application is currently being reviewed by our team.',
        }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex-shrink-0">
                <Logo variant="default" size="md" showTagline={false} />
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Home</Link>
                <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">About</Link>
                <Link href="/for-installers" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">For Installers</Link>
                <Link href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">How It Works</Link>
                <Link href="/#faq" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">FAQ</Link>
                <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Contact</Link>
              </nav>
              <div className="hidden md:flex items-center">
                <Link href="/estimator" className="btn-primary text-sm">Get Free Estimate</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="h-20"></div>
        <section className="pt-12 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <p className="text-gray-600">Loading application status...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex-shrink-0">
                <Logo variant="default" size="md" showTagline={false} />
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Home</Link>
                <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">About</Link>
                <Link href="/for-installers" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">For Installers</Link>
                <Link href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">How It Works</Link>
                <Link href="/#faq" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">FAQ</Link>
                <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Contact</Link>
              </nav>
              <div className="hidden md:flex items-center">
                <Link href="/estimator" className="btn-primary text-sm">Get Free Estimate</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="h-20"></div>
        <section className="pt-12 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <AlertCircle className="text-yellow-500 mx-auto mb-4" size={48} />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
              <p className="text-gray-600 mb-6">
                We couldn't find an application with that ID. Please check your application ID or submit a new application.
              </p>
              <Link href="/for-installers/apply" className="btn-primary">
                Submit New Application
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header wrapper with forced white background */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex-shrink-0">
              <Logo variant="default" size="md" showTagline={false} />
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Home</Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">About</Link>
              <Link href="/for-installers" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">For Installers</Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">How It Works</Link>
              <Link href="/#faq" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">FAQ</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Contact</Link>
            </nav>
            <div className="hidden md:flex items-center">
              <Link href="/estimator" className="btn-primary text-sm">Get Free Estimate</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="h-20"></div>

      {/* Status Section */}
      <section className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Card */}
          <div className={`bg-white rounded-2xl p-8 shadow-md border-2 ${statusConfig.borderColor} mb-6`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
                <StatusIcon className={statusConfig.color} size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{statusConfig.title}</h1>
                <p className="text-gray-600">{statusConfig.description}</p>
              </div>
            </div>

            {application.id && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Application ID</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{application.id}</p>
              </div>
            )}

            {/* Review Notes */}
            {application.reviewNotes && (
              <div className={`${statusConfig.bgColor} rounded-lg p-6 mb-6`}>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className={statusConfig.color} size={20} />
                  Review Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{application.reviewNotes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(application.submittedAt).toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              {application.reviewedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-forest-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Review Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(application.reviewedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-2xl p-8 shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="text-forest-500" size={20} />
                  Company Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Company:</span> {application.data?.companyName || 'N/A'}</p>
                  <p><span className="font-semibold">Contact:</span> {application.data?.contactPersonName || 'N/A'}</p>
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    {application.data?.contactEmail || 'N/A'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    {application.data?.contactPhone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="text-forest-500" size={20} />
                  Service Areas
                </h3>
                <div className="space-y-2 text-sm">
                  {application.data?.primaryServiceProvinces?.length > 0 ? (
                    <div>
                      <p className="font-semibold mb-1">Provinces:</p>
                      <div className="flex flex-wrap gap-2">
                        {application.data.primaryServiceProvinces.map((province: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-semibold">
                            {province}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>No provinces specified</p>
                  )}
                  {application.data?.serviceAreaDescription && (
                    <p className="mt-2">
                      <span className="font-semibold">Description:</span> {application.data.serviceAreaDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {application.status === 'pending_review' && (
            <div className="bg-sky-50 rounded-2xl p-8 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Next?</h2>
              <p className="text-gray-700 mb-4">
                Your application is being reviewed. You'll receive an email notification once the review is complete, typically within 2-3 business days.
              </p>
              <p className="text-sm text-gray-600">
                We'll notify you at <strong>{application.data?.contactEmail}</strong>
              </p>
            </div>
          )}

          {application.status === 'approved' && (
            <div className="bg-green-50 rounded-2xl p-8 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Network!</h2>
              <p className="text-gray-700 mb-4">
                Your application has been approved. You'll receive onboarding instructions via email shortly.
              </p>
              <Link href="/for-installers/dashboard" className="btn-primary inline-flex items-center">
                Go to Dashboard
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="bg-red-50 rounded-2xl p-8 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Approved</h2>
              <p className="text-gray-700 mb-4">
                We appreciate your interest in joining our network. Unfortunately, we're unable to approve your application at this time.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                If you have questions about this decision, please contact our support team.
              </p>
              <Link href="/contact" className="btn-outline inline-flex items-center">
                Contact Support
              </Link>
            </div>
          )}

          {application.status === 'need_more_info' && (
            <div className="bg-yellow-50 rounded-2xl p-8 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Information Required</h2>
              <p className="text-gray-700 mb-4">
                We need some additional information to complete your application review. Please check the review notes above and provide the requested information.
              </p>
              <Link href="/contact" className="btn-primary inline-flex items-center">
                Contact Us to Provide Information
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/for-installers" className="btn-outline text-center">
              Back to Installer Info
            </Link>
            <Link href="/contact" className="btn-outline text-center">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function InstallerApplicationStatusPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex-shrink-0">
                <Logo variant="default" size="md" showTagline={false} />
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Home</Link>
                <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">About</Link>
                <Link href="/for-installers" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">For Installers</Link>
                <Link href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">How It Works</Link>
                <Link href="/#faq" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">FAQ</Link>
                <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-maple-500 transition-colors">Contact</Link>
              </nav>
              <div className="hidden md:flex items-center">
                <Link href="/estimator" className="btn-primary text-sm">Get Free Estimate</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="h-20"></div>
        <section className="pt-12 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <p className="text-gray-600">Loading application status...</p>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <InstallerApplicationStatusContent />
    </Suspense>
  )
}

