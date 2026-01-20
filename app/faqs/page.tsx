'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FAQ } from '@/components/FAQ'
import Link from 'next/link'

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about going solar
          </p>
        </div>
      </section>

      {/* FAQ Component */}
      <FAQ />

      {/* Additional Help Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl text-center">
            <h2 className="heading-lg mb-4">Still Have Questions?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Reach out to our support team and we'll be happy to help.
            </p>
            <Link
              href="/contact"
              className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
