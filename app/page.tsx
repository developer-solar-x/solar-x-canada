// Main landing page assembling all sections

'use client'

import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { HowItWorks } from '@/components/HowItWorks'
import { Calculator } from '@/components/Calculator'
import { Stats } from '@/components/Stats'
import { FAQ } from '@/components/FAQ'
import { Testimonials } from '@/components/Testimonials'
import { FinalCTA } from '@/components/FinalCTA'
import { Footer } from '@/components/Footer'
import { ResumeEstimateBanner } from '@/components/ResumeEstimateBanner'

export default function Home() {
  // Handle smooth scrolling to anchor links with header offset
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash) {
        const element = document.querySelector(hash)
        if (element) {
          const headerOffset = 80 // Header height
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }
    }

    // Handle initial hash if present
    handleHashChange()

    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    // Also handle it after a short delay in case page is still loading
    const timeoutId = setTimeout(handleHashChange, 100)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      clearTimeout(timeoutId)
    }
  }, [])

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

      {/* Statistics counters */}
      <Stats />

      {/* Testimonials section */}
      <Testimonials />

      {/* FAQ accordion */}
      <FAQ />

      {/* Final call-to-action */}
      <FinalCTA />

      {/* Footer with links */}
      <Footer />
    </main>
  )
}

