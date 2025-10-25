// How It Works section with step-by-step process

import Link from 'next/link'
import { Map, Calculator, Handshake } from 'lucide-react'

export function HowItWorks() {
  // Process steps data
  const steps = [
    {
      number: '01',
      icon: Map,
      title: 'Pinpoint Your Roof',
      description: 'Use our interactive map tool to outline your roof in seconds. Our AI verifies the dimensions.',
      color: 'text-red-500',
    },
    {
      number: '02',
      icon: Calculator,
      title: 'See Your Savings',
      description: 'Instantly see system size, costs, savings, payback period, and environmental impact.',
      color: 'text-navy-500',
    },
    {
      number: '03',
      icon: Handshake,
      title: 'Get Matched',
      description: 'We connect you with vetted, certified local installers for competitive quotes.',
      color: 'text-red-500',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Decorative wave pattern */}
      <div className="absolute top-0 left-0 right-0 h-32 opacity-10">
        <svg viewBox="0 0 1200 120" className="w-full h-full">
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z"
            fill="currentColor"
            className="text-blue-500"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-4">Your Journey to Solar</h2>
        </div>

        {/* Steps timeline */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200">
            <div className="h-full w-2/3 bg-blue-500"></div>
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
                <h3 className="text-2xl font-bold text-navy-500 mb-4">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Visual mockup placeholder */}
                <div className="mt-6 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Screenshot placeholder</p>
                </div>
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

