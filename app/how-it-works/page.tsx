'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HowItWorks } from '@/components/HowItWorks'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            How It Works
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Simple, transparent process from estimate to installation
          </p>
        </div>
      </section>

      {/* How It Works Component */}
      <HowItWorks />

      {/* Additional Information Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <h2 className="heading-lg mb-6 text-center">Why Choose Our Platform?</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-forest-500 pl-6">
                <h3 className="text-xl font-bold text-forest-500 mb-2">
                  Independent & Unbiased
                </h3>
                <p className="text-gray-700">
                  We're not owned by any solar company. Our calculator uses transparent, verifiable data, and we have no incentive to inflate estimates or push specific products.
                </p>
              </div>
              <div className="border-l-4 border-maple-500 pl-6">
                <h3 className="text-xl font-bold text-maple-500 mb-2">
                  Vetted Installer Network
                </h3>
                <p className="text-gray-700">
                  Every installer in our network undergoes thorough vetting. We verify certifications, insurance, experience, and customer references before approval.
                </p>
              </div>
              <div className="border-l-4 border-sky-500 pl-6">
                <h3 className="text-xl font-bold text-sky-500 mb-2">
                  Double Warranty Protection
                </h3>
                <p className="text-gray-700">
                  You receive protection from both the installer's warranty and our platform guarantee. If issues arise, we're here to help resolve them.
                </p>
              </div>
              <div className="border-l-4 border-amber-500 pl-6">
                <h3 className="text-xl font-bold text-amber-500 mb-2">
                  No Sales Pressure
                </h3>
                <p className="text-gray-700">
                  We don't make money from installations. Our goal is to provide you with honest information and quality connections—the decision is always yours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start with our free, unbiased calculator to see your solar savings estimate
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Start Your Estimate
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
