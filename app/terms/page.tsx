'use client'

// Terms of Service page

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FileText, Scale, AlertCircle, Shield, Users, Mail, Calendar } from 'lucide-react'

export default function TermsPage() {
  const lastUpdated = 'December 2025'

  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            By accessing and using Solar Calculator Canada's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
          <p className="text-gray-700 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of our website, solar calculator, and related services (collectively, the "Service"). By using our Service, you agree to comply with and be bound by these Terms.
          </p>
        </div>
      ),
    },
    {
      icon: Scale,
      title: '2. Description of Service',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Solar Calculator Canada provides an independent platform that:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Offers free solar savings estimates and calculations</li>
            <li>Connects homeowners with vetted solar installers</li>
            <li>Provides educational resources about solar energy</li>
            <li>Facilitates communication between homeowners and installers</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Our Service is provided "as is" and we make no warranties or representations about the accuracy, completeness, or reliability of any estimates, calculations, or information provided.
          </p>
        </div>
      ),
    },
    {
      icon: AlertCircle,
      title: '3. Estimates and Calculations',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            <strong>Important Disclaimer:</strong> All estimates, calculations, savings projections, and other information provided through our Service are estimates only and are not guarantees.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Actual pricing, production, incentives, fees, and savings may vary significantly</li>
            <li>We do not guarantee approval for any utility program or government incentive</li>
            <li>Delivery charges and utility service fees are not included in estimates</li>
            <li>Actual system performance depends on many factors including weather, installation quality, and equipment performance</li>
            <li>You should verify all details with a licensed solar professional and your local utility provider</li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-yellow-900 text-sm leading-relaxed">
              <strong>Note:</strong> Our calculator uses industry-standard formulas and assumptions, but actual results will depend on site-specific conditions, installer pricing, and other factors beyond our control.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Users,
      title: '4. Installer Matching and Referrals',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            When you complete a solar estimate, we may share your information with vetted installers in our network. By using our Service, you consent to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Being contacted by vetted installers regarding your estimate</li>
            <li>Sharing your contact information and estimate details with installers</li>
            <li>Receiving communications from installers and our platform</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            We are not responsible for the services, pricing, or conduct of any installer. All agreements, contracts, and transactions are between you and the installer. We do not guarantee the quality, pricing, or performance of any installer's services.
          </p>
          <p className="text-gray-700 leading-relaxed">
            While we vet installers for certifications, insurance, and experience, you are responsible for conducting your own due diligence before entering into any agreement with an installer.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '5. User Responsibilities',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You agree to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Provide accurate and truthful information when using our Service</li>
            <li>Use the Service only for lawful purposes</li>
            <li>Not attempt to interfere with or disrupt the Service</li>
            <li>Not use the Service to transmit any harmful, offensive, or illegal content</li>
            <li>Respect the intellectual property rights of Solar Calculator Canada and third parties</li>
            <li>Verify all estimates and information with qualified professionals before making decisions</li>
          </ul>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '6. Intellectual Property',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, and software, are the property of Solar Calculator Canada or its content suppliers and are protected by Canadian and international copyright, trademark, and other intellectual property laws.
          </p>
          <p className="text-gray-700 leading-relaxed">
            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service without our prior written consent.
          </p>
        </div>
      ),
    },
    {
      icon: AlertCircle,
      title: '7. Limitation of Liability',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            To the fullest extent permitted by law, Solar Calculator Canada, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Your use or inability to use the Service</li>
            <li>Any errors or inaccuracies in estimates, calculations, or information provided</li>
            <li>Any actions or omissions of installers or third parties</li>
            <li>Any unauthorized access to or use of our servers or data</li>
            <li>Any interruption or cessation of transmission to or from our Service</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid to us, if any, in the twelve months preceding the claim.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '8. Indemnification',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You agree to indemnify, defend, and hold harmless Solar Calculator Canada, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Any agreements or transactions between you and installers</li>
          </ul>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '9. Modifications to Service',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to modify, suspend, or discontinue the Service, or any part thereof, at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We may also update these Terms from time to time. We will notify you of any material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after any changes indicates your acceptance of the updated Terms.
          </p>
        </div>
      ),
    },
    {
      icon: Scale,
      title: '10. Governing Law',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of Canada, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Canada.
          </p>
        </div>
      ),
    },
    {
      icon: AlertCircle,
      title: '11. Severability',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid, illegal, or unenforceable provision shall be replaced with a valid, legal, and enforceable provision that comes closest to the intent of the original provision.
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '12. Entire Agreement',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Solar Calculator Canada regarding the Service and supersede all prior or contemporaneous communications, proposals, and agreements, whether oral or written, relating to the subject matter hereof.
          </p>
        </div>
      ),
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-forest-500 to-forest-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Scale size={48} className="text-white" />
            <h1 className="heading-lg !text-white">Terms of Service</h1>
          </div>
          <p className="text-xl text-white leading-relaxed">
            Please read these terms carefully before using our solar calculator and services. By using our Service, you agree to be bound by these Terms.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white">
            <Calendar size={16} />
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                Welcome to Solar Calculator Canada. These Terms of Service ("Terms") govern your access to and use of our website, solar calculator, and related services. By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you do not agree to these Terms, please do not use our Service. We recommend that you read these Terms carefully and keep a copy for your records.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 mt-1">
                      <section.icon className="text-forest-500" size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="ml-12">{section.content}</div>
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-16 bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <Mail className="text-forest-500 flex-shrink-0 mt-1" size={28} />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms?</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <strong>Email:</strong>{' '}
                      <a
                        href="mailto:info@solarcalculatorcanada.org"
                        className="text-forest-600 hover:text-forest-700 font-semibold"
                      >
                        info@solarcalculatorcanada.org
                      </a>
                    </p>
                    <p className="text-gray-700">
                      <strong>Website:</strong>{' '}
                      <a
                        href="https://www.solarcalculatorcanada.org"
                        className="text-forest-600 hover:text-forest-700 font-semibold"
                      >
                        www.solarcalculatorcanada.org
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
