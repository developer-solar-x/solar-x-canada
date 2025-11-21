'use client'

// Installer pricing/plans page

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckCircle, ArrowRight, Zap, Users, TrendingUp, Shield } from 'lucide-react'
import Link from 'next/link'

export default function InstallerPricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for new installers getting started',
      features: [
        'Up to 5 leads per month',
        'Basic profile listing',
        'Email support',
        'Access to installer dashboard',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing installation businesses',
      features: [
        'Up to 25 leads per month',
        'Featured profile listing',
        'Priority support',
        'Advanced analytics',
        'Project gallery',
        'Customer review management',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For established installation companies',
      features: [
        'Unlimited leads',
        'Premium profile placement',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'API access',
        'Priority matching',
      ],
      popular: false,
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/90">
            Select the plan that fits your business needs
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg ${
                  plan.popular
                    ? 'border-2 border-forest-500 transform scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-forest-500 text-white text-center py-2 rounded-t-lg -mt-8 -mx-8 mb-4">
                    <span className="font-semibold">Most Popular</span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/for-installers/apply"
                  className={`w-full block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-forest-500 text-white hover:bg-forest-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  <ArrowRight className="inline ml-2" size={18} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">All Plans Include</h2>
            <p className="text-lg text-gray-600">
              Core features available to all installers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-forest-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Qualified Leads</h3>
              <p className="text-gray-600">
                All leads are pre-qualified homeowners ready to go solar
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-sky-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vetted Network</h3>
              <p className="text-gray-600">
                Join a network of verified, quality installers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-maple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-maple-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business Growth</h3>
              <p className="text-gray-600">
                Access tools and resources to grow your installation business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold font-display mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Apply today and start receiving qualified leads
          </p>
          <Link
            href="/for-installers/apply"
            className="btn-primary bg-maple-500 hover:bg-maple-600 inline-flex items-center text-lg h-14 px-10"
          >
            Apply Now
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}

