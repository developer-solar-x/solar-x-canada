'use client'

// Feedback page - standalone page for submitting feedback

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FeedbackForm } from '@/components/FeedbackForm'

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-12 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Help Us Improve
          </h1>
          <p className="text-xl text-white/90">
            Your feedback helps us make the calculator better for everyone
          </p>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">
            <FeedbackForm isModal={false} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

