// Main landing page assembling all sections

'use client'

import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { HowItWorks } from '@/components/HowItWorks'
import { Calculator } from '@/components/Calculator'
import { Testimonials } from '@/components/Testimonials'
import { Stats } from '@/components/Stats'
import { FAQ } from '@/components/FAQ'
import { FinalCTA } from '@/components/FinalCTA'
import { Footer } from '@/components/Footer'
import { ResumeEstimateBanner } from '@/components/ResumeEstimateBanner'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation header */}
      <Header />

      {/* Resume estimate banner (shows if saved progress exists) */}
      <ResumeEstimateBanner />

      {/* Hero section with CTA */}
      <Hero />

      {/* Features grid */}
      <Features />

      {/* How it works timeline */}
      <HowItWorks />

      {/* Interactive calculator */}
      <Calculator />

      {/* Customer testimonials */}
      <Testimonials />

      {/* Statistics counters */}
      <Stats />

      {/* FAQ accordion */}
      <FAQ />

      {/* Final call-to-action */}
      <FinalCTA />

      {/* Footer with links */}
      <Footer />
    </main>
  )
}

