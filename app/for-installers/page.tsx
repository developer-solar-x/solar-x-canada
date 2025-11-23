'use client'

// For Installers page explaining matching process and vetting

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Shield, CheckCircle, Users, Award, FileCheck, MapPin, TrendingUp, ArrowRight, FileText } from 'lucide-react'
import Link from 'next/link'

export default function ForInstallersPage() {
  const benefits = [
    {
      icon: Users,
      title: 'Qualified Leads',
      description: 'Connect with homeowners who are serious about going solar. All leads are pre-qualified and ready to move forward.',
    },
    {
      icon: Award,
      title: 'Credibility Boost',
      description: 'Being part of our vetted network builds trust with potential customers. Our platform endorsement signals quality and reliability.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Access a steady stream of qualified leads without spending on expensive marketing. Focus on installations, not lead generation.',
    },
    {
      icon: Shield,
      title: 'Platform Support',
      description: 'We handle initial customer education and matching. You receive leads who understand solar and are ready to proceed.',
    },
  ]

  const requirements = [
    {
      icon: FileCheck,
      title: 'Certifications',
      description: 'Valid provincial electrical certifications (ESA in Ontario, equivalent in other provinces). Manufacturer certifications for equipment you install.',
    },
    {
      icon: Shield,
      title: 'Insurance',
      description: 'General liability insurance with minimum coverage as required by your province. Proof of insurance must be current and verifiable.',
    },
    {
      icon: Award,
      title: 'Experience',
      description: 'Minimum years in business and number of installations completed. We verify your track record and customer satisfaction.',
    },
    {
      icon: CheckCircle,
      title: 'Quality Standards',
      description: 'Commitment to quality workmanship, customer service, and honoring warranties. We review references and past projects.',
    },
  ]

  const process = [
    {
      step: '01',
      title: 'Submit Application',
      description: 'Fill out our detailed application form with company information, certifications, insurance details, and service areas.',
    },
    {
      step: '02',
      title: 'Document Review',
      description: 'Our team reviews all submitted documents, verifies certifications and insurance, and checks your business credentials.',
    },
    {
      step: '03',
      title: 'Quality Assessment',
      description: 'We review your past projects, customer references, and ensure you meet our quality and service standards.',
    },
    {
      step: '04',
      title: 'Approval & Onboarding',
      description: 'Once approved, you\'ll be onboarded to our platform and can start receiving qualified leads in your service area.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            For Solar Installers
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Join our vetted network of quality solar installers. Connect with qualified homeowners and grow your business with trusted leads.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/for-installers/apply"
              className="btn-primary bg-maple-500 hover:bg-maple-600 inline-flex items-center justify-center text-lg h-14 px-10"
            >
              Join Installer Network
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              href="/for-installers/apply/track"
              className="btn-outline bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white inline-flex items-center justify-center text-lg h-14 px-10"
            >
              Check My Application
              <FileText className="ml-2" size={20} />
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-4">
            Application process typically takes 2-3 business days
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Why Join Our Network?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access qualified leads, build credibility, and grow your solar installation business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="text-sky-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-forest-500 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple process from application to receiving qualified leads
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {process.map((step, index) => (
              <div
                key={index}
                className="relative bg-white rounded-xl p-8 border-l-4 border-sky-500 shadow-md"
              >
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-forest-500 mb-3 mt-4">
                  {step.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Vetting Requirements</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We maintain high standards to ensure quality for homeowners
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="bg-forest-50 rounded-xl p-6 border border-forest-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <req.icon className="text-forest-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-forest-500 mb-2">
                      {req.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Double Warranty Section */}
      <section className="py-20 bg-gradient-to-br from-sky-50 to-forest-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-maple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-maple-500" size={32} />
              </div>
              <h2 className="heading-lg mb-4">Double Warranty Framework</h2>
              <p className="text-lg text-gray-600">
                How our warranty structure protects homeowners and installers
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-forest-500 pl-6">
                <h3 className="text-xl font-bold text-forest-500 mb-2">
                  Your Standard Warranty
                </h3>
                <p className="text-gray-700">
                  You provide your normal workmanship and equipment warranty as you would for any installation. This is the primary protection for homeowners.
                </p>
              </div>

              <div className="border-l-4 border-maple-500 pl-6">
                <h3 className="text-xl font-bold text-maple-500 mb-2">
                  Platform Guarantee
                </h3>
                <p className="text-gray-700">
                  In addition to your warranty, our platform provides an additional layer of protection. If issues arise and aren't resolved, we help facilitate solutions. This builds trust with homeowners and protects your reputation.
                </p>
              </div>

              <div className="bg-sky-50 rounded-lg p-6 mt-8">
                <p className="text-gray-700 leading-relaxed">
                  <strong className="text-forest-500">Benefits for you:</strong> The double warranty framework gives homeowners confidence, which can lead to faster decision-making and higher close rates. It also demonstrates our commitment to quality and customer satisfaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-sky-500" size={32} />
            </div>
            <h2 className="heading-lg mb-4">Service Areas</h2>
            <p className="text-lg text-gray-600">
              Currently seeking installers in these provinces
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-forest-50 rounded-xl p-6 border-2 border-forest-500">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 bg-maple-500 rounded-full animate-pulse" />
                <h3 className="text-xl font-bold text-forest-500">Ontario</h3>
                <span className="px-3 py-1 bg-maple-500/20 text-maple-700 text-xs font-semibold rounded-full">Active</span>
              </div>
              <p className="text-gray-700">
                Fully operational. We're actively matching homeowners with installers across Ontario.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-300">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-bold text-gray-600">Alberta</h3>
                <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-semibold rounded-full">Coming Soon</span>
              </div>
              <p className="text-gray-700">
                Launching soon. We're building our installer network in Alberta. Apply now to be among the first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Ready to Join Our Network?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Apply today to start receiving qualified solar installation leads
          </p>
          <Link
            href="/for-installers/apply"
            className="btn-primary bg-maple-500 hover:bg-maple-600 inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Apply to Join
            <ArrowRight className="ml-2" size={20} />
          </Link>
          <p className="text-white/80 text-sm mt-4">
            Application process typically takes 2-3 business days
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}

