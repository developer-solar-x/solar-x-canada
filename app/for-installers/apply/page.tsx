'use client'

// Installer application page

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { InstallerIntakeForm, InstallerFormData } from '@/components/InstallerIntakeForm'
import { Loader2 } from 'lucide-react'

// Force dynamic rendering to avoid static generation issues with PostHogProvider
export const dynamic = 'force-dynamic'

export default function InstallerApplyPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: InstallerFormData & { applicationId?: string; apiResult?: any }) => {
    // Set submitting state immediately to show loading
    setSubmitting(true)
    
    try {
      // The form component already called the API, so we just need to handle the result
      const applicationId = data.applicationId || data.apiResult?.applicationId || `app-${Date.now()}`
      
      // Store application data in both sessionStorage and localStorage
      const applicationData = {
        id: applicationId,
        data,
        status: 'pending_review',
        submittedAt: new Date().toISOString(),
      }
      
      sessionStorage.setItem('installerApplication', JSON.stringify(applicationData))
      localStorage.setItem('installerApplication', JSON.stringify(applicationData))
      
      // Small delay to ensure loading state is visible before redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Redirect to success page
      router.push(`/for-installers/apply/success?applicationId=${applicationId}`)
    } catch (error) {
      console.error('Error handling submission:', error)
      setSubmitting(false)
      // Error is already handled in the form component
    }
  }

  const handleCancel = () => {
    router.push('/for-installers')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Apply to Join Our Network
          </h1>
          <p className="text-xl text-white/90">
            Complete the form below to start receiving qualified solar installation leads
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitting ? (
            <div className="bg-white rounded-2xl p-12 shadow-md text-center">
              <Loader2 className="animate-spin text-forest-500 mx-auto mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitting Your Application</h2>
              <p className="text-gray-600">Please wait while we process your information...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <InstallerIntakeForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

