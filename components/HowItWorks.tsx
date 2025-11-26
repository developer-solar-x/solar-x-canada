// How It Works section with step-by-step process

'use client'

import Link from 'next/link'
import { Zap, LineChart, Handshake, Shield } from 'lucide-react'

export function HowItWorks() {

  // Process steps data
  const steps = [
    {
      number: '01',
      icon: Zap,
      title: 'Answer a Few Questions',
      description: 'Provide basic information about your home and energy use. Our calculator uses transparent data to estimate your solar potential.',
      color: 'text-maple-500',
    },
    {
      number: '02',
      icon: LineChart,
      title: 'See Your Estimated Savings',
      description: 'View your personalized results: system size, payback period, monthly savings, and environmental impact. All calculations are transparent.',
      color: 'text-forest-500',
    },
    {
      number: '03',
      icon: Handshake,
      title: 'Get Matched with a Vetted Installer',
      description: 'Connect with carefully vetted local installers. All partners are certified, insured, and committed to quality service.',
      color: 'text-maple-500',
    },
    {
      number: '04',
      icon: Shield,
      title: 'Enjoy Double Warranty Protection',
      description: 'Benefit from both installer warranties and our platform guarantee. Complete peace of mind for your solar investment.',
      color: 'text-sky-500',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-sky-50 to-white relative overflow-hidden">
      {/* Decorative wave pattern */}
      <div className="absolute top-0 left-0 right-0 h-32 opacity-10">
        <svg viewBox="0 0 1200 120" className="w-full h-full">
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z"
            fill="currentColor"
            className="text-sky-500"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple, transparent process from estimate to installation
          </p>
        </div>

        {/* Steps timeline */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200">
            <div className="h-full w-3/4 bg-sky-500"></div>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Large number badge in background */}
              <div className={`absolute -top-8 -left-4 text-8xl font-bold ${step.color} opacity-10 font-display`}>
                {step.number}
              </div>

              {/* Card content */}
              <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                {/* Icon */}
                <div className={`${step.color} mb-6`}>
                  <step.icon size={48} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-forest-500 mb-4">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Start Your Estimate
          </Link>
        </div>
      </div>
    </section>
  )
}

