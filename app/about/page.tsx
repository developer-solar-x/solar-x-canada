'use client'

// About/Trust page explaining independent platform mission

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Shield, CheckCircle, Eye, Users, Award, Heart } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Eye,
      title: 'Transparent Data',
      description: 'All calculations are open and verifiable. We show you exactly how we arrive at your solar savings estimates, with no hidden formulas or inflated projections.',
    },
    {
      icon: Shield,
      title: 'Consumer Protection',
      description: 'Our mission is to protect homeowners. We vet every installer, verify certifications, and ensure quality standards before any match is made.',
    },
    {
      icon: CheckCircle,
      title: 'Double Warranty',
      description: 'You get protection from both the installer\'s warranty and our platform guarantee. If something goes wrong, we\'re here to help resolve it.',
    },
    {
      icon: Users,
      title: 'Vetted Professionals',
      description: 'Every installer in our network undergoes thorough screening: certifications, insurance, experience, and customer reviews. Quality is non-negotiable.',
    },
    {
      icon: Award,
      title: 'Independent Platform',
      description: 'We\'re not owned by any solar company. Our only interest is connecting you with the best installers and providing honest, unbiased information.',
    },
    {
      icon: Heart,
      title: 'Your Best Interest',
      description: 'We don\'t make money from installations. Our goal is simple: help you make an informed decision about solar with zero sales pressure.',
    },
  ]

  const vettingProcess = [
    {
      step: '01',
      title: 'Initial Application',
      description: 'Installers submit detailed information about their company, certifications, insurance coverage, and years of experience.',
    },
    {
      step: '02',
      title: 'Document Verification',
      description: 'We verify all certifications, insurance policies, and business licenses. No shortcuts, no exceptions.',
    },
    {
      step: '03',
      title: 'Quality Review',
      description: 'We review past projects, customer references, and ensure installers meet our quality standards for workmanship and service.',
    },
    {
      step: '04',
      title: 'Ongoing Monitoring',
      description: 'Approved installers are continuously monitored. We track customer satisfaction and address any concerns promptly.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            About Our Platform
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            An independent, consumer-focused platform connecting Canadian homeowners with vetted solar installers. No sales pressure, just honest information and quality connections.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              To empower Canadian homeowners with transparent, unbiased information about solar energy and connect them with trustworthy, vetted installers—all while protecting their interests every step of the way.
            </p>
          </div>

          <div className="bg-sky-50 rounded-2xl p-8 md:p-12 border border-sky-100">
            <h3 className="text-2xl font-bold text-forest-500 mb-4">Why We Exist</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The solar industry can be overwhelming. Homeowners face confusing information, aggressive sales tactics, and uncertainty about which installers to trust. We created this platform to change that.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We operate as an independent, non-branded platform with no ties to any solar company. Our calculator uses transparent, verifiable data. Our installer network is carefully vetted. And our only goal is to help you make the best decision for your home and your wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-maple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="text-maple-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-forest-500 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vetting Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">How We Vet Installers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our rigorous vetting process ensures only qualified, trustworthy installers join our network
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {vettingProcess.map((step, index) => (
              <div
                key={index}
                className="relative bg-forest-50 rounded-xl p-8 border-l-4 border-forest-500"
              >
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center">
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

      {/* Double Warranty Section */}
      <section className="py-20 bg-gradient-to-br from-sky-50 to-forest-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-maple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-maple-500" size={32} />
              </div>
              <h2 className="heading-lg mb-4">Double Warranty Protection</h2>
              <p className="text-lg text-gray-600">
                Extra peace of mind for your solar investment
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-forest-500 pl-6">
                <h3 className="text-xl font-bold text-forest-500 mb-2">
                  Installer Warranty
                </h3>
                <p className="text-gray-700">
                  Every installer provides their standard warranty covering workmanship and equipment. This is your first layer of protection.
                </p>
              </div>

              <div className="border-l-4 border-maple-500 pl-6">
                <h3 className="text-xl font-bold text-maple-500 mb-2">
                  Platform Guarantee
                </h3>
                <p className="text-gray-700">
                  In addition to the installer warranty, our platform provides an additional guarantee. If issues arise and the installer doesn't resolve them, we step in to help find a solution.
                </p>
              </div>

              <div className="bg-sky-50 rounded-lg p-6 mt-8">
                <p className="text-gray-700 leading-relaxed">
                  <strong className="text-forest-500">What this means for you:</strong> You have two layers of protection. If something goes wrong with your installation, you can reach out to both the installer and our platform support team. We're committed to ensuring your satisfaction.
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
            Check your solar savings with our free, unbiased calculator
          </p>
          <a
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Check Your Solar Savings
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}

