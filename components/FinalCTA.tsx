// Final call-to-action section with prominent button

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export function FinalCTA() {
  // Trust indicators
  const indicators = [
    'No Credit Card',
    '100% Free',
    'Secure & Private',
    'Quick & Easy',
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-cta" />
      
      {/* Geometric overlay shapes */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-navy-500 text-[20rem] font-bold font-display">
          X
        </div>
      </div>

      {/* Floating shapes */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-navy-500 rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-40 h-40 border-2 border-navy-500 rotate-45" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 border-2 border-navy-500 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-display leading-tight">
          Ready to Go Solar with SolarX?
        </h2>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Get your free, no-obligation estimate in just a few minutes
        </p>

        {/* CTA button */}
        <div className="mb-8">
          <Link
            href="/estimator"
            className="inline-flex items-center justify-center bg-white text-navy-500 font-bold text-lg px-12 py-5 rounded-lg hover:bg-blue-50 transition-all hover:shadow-2xl hover:scale-105 animate-pulse-slow"
          >
            Start Your Free Estimate
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <div className="hidden sm:block w-px h-4 bg-white/30 mr-6" />
              )}
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{indicator}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

