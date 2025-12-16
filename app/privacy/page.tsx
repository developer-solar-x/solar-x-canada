'use client'

// Privacy Policy page

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Shield, Lock, Eye, FileText, Mail, Calendar, Users } from 'lucide-react'

export default function PrivacyPage() {
  const lastUpdated = 'December 2025'

  const sections = [
    {
      icon: FileText,
      title: '1. Information We Collect',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
            <p className="text-gray-700 leading-relaxed">
              When you use our solar calculator and services, we may collect the following information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3 ml-4">
              <li>Name, email address, and phone number</li>
              <li>Property address and location data</li>
              <li>Energy usage information (monthly bills, annual consumption)</li>
              <li>Roof details and property characteristics</li>
              <li>Photos of your property (if provided)</li>
              <li>Financing preferences and other selections made during the estimate process</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Technical Information</h4>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect certain technical information when you visit our website:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3 ml-4">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referral sources and search terms</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Providing Services:</strong> To generate personalized solar estimates and calculations based on your property and energy usage</li>
            <li><strong>Matching with Installers:</strong> To connect you with vetted solar installers who can provide quotes and services for your property</li>
            <li><strong>Communication:</strong> To send you estimate results, follow-up emails, and respond to your inquiries</li>
            <li><strong>Improving Our Services:</strong> To analyze usage patterns and improve our calculator and platform</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Users,
      title: '3. Sharing Information with Vetted Installers',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            One of our core services is connecting homeowners with qualified solar installers. When you complete a solar estimate, we may share your information with vetted installers in our network. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3 ml-4">
            <li>Contact information (name, email, phone number)</li>
            <li>Property address and location</li>
            <li>Energy usage data and property details</li>
            <li>Estimate results and preferences you've selected</li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-900 text-sm leading-relaxed">
              <strong>Important:</strong> All installers in our network undergo a thorough vetting process including verification of certifications, insurance, experience, and customer reviews. We only share your information with installers who meet our quality standards.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Lock,
      title: '4. Data Storage and Security',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We take the security of your information seriously:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Data is stored securely using industry-standard encryption and security measures</li>
            <li>We use secure databases and cloud storage services with appropriate access controls</li>
            <li>Access to personal information is restricted to authorized personnel and vetted installers</li>
            <li>We regularly review and update our security practices</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '5. Your Rights and Choices',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Access:</strong> You can request access to the personal information we hold about you</li>
            <li><strong>Correction:</strong> You can request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> You can request deletion of your personal information, subject to legal and operational requirements</li>
            <li><strong>Opt-Out:</strong> You can opt out of receiving communications from us or our installer partners</li>
            <li><strong>Data Portability:</strong> You can request a copy of your data in a portable format</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:info@solarcalculatorcanada.org" className="text-forest-600 hover:text-forest-700 font-semibold">
              info@solarcalculatorcanada.org
            </a>
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '6. Cookies and Tracking Technologies',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Remember your preferences and save your progress during estimate calculations</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Improve user experience and website functionality</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website and calculator.
          </p>
        </div>
      ),
    },
    {
      icon: Calendar,
      title: '7. Data Retention',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We retain your personal information for as long as necessary to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Provide our services and fulfill the purposes outlined in this policy</li>
            <li>Comply with legal obligations and resolve disputes</li>
            <li>Enforce our agreements and protect our rights</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Partial leads (incomplete estimates) may be retained for up to 30 days to allow you to resume your estimate. Completed estimates and lead information may be retained longer to facilitate installer connections and customer support.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: '8. Children\'s Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately and we will take steps to delete such information.
          </p>
        </div>
      ),
    },
    {
      icon: FileText,
      title: '9. Third-Party Services',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We may use third-party services for:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Email delivery and communication services</li>
            <li>Data analytics and website performance monitoring</li>
            <li>Cloud storage and database hosting</li>
            <li>Payment processing (if applicable)</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Calendar,
      title: '10. Changes to This Privacy Policy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Posting the updated policy on this page</li>
            <li>Updating the "Last Updated" date at the top of this policy</li>
            <li>Sending an email notification for significant changes (if we have your email address)</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Your continued use of our services after any changes indicates your acceptance of the updated policy.
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
            <Shield size={48} className="text-white" />
            <h1 className="heading-lg !text-white">Privacy Policy</h1>
          </div>
          <p className="text-xl text-white leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you use our solar calculator and services.
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
                At Solar Calculator Canada, we are committed to protecting your privacy and being transparent about how we handle your personal information. This Privacy Policy describes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>What information we collect and why</li>
                <li>How we use and share your information</li>
                <li>Your rights and choices regarding your information</li>
                <li>How we protect your information</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-6">
                By using our website and services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Policy Sections */}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
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

