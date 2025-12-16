'use client'

// Accessibility page

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Accessibility, Eye, MousePointer, Keyboard, Volume2, Mail, Calendar } from 'lucide-react'

export default function AccessibilityPage() {
  const lastUpdated = 'December 2025'

  const sections = [
    {
      icon: Accessibility,
      title: 'Our Commitment to Accessibility',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Solar Calculator Canada is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to achieve these goals.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA standards, which explain how to make web content more accessible for people with disabilities and user-friendly for everyone.
          </p>
        </div>
      ),
    },
    {
      icon: Eye,
      title: 'Visual Accessibility',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We have implemented the following features to improve visual accessibility:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Color Contrast:</strong> We maintain sufficient color contrast ratios between text and background colors to ensure readability</li>
            <li><strong>Text Scaling:</strong> Our website supports browser zoom up to 200% without loss of functionality</li>
            <li><strong>Alternative Text:</strong> Images include descriptive alternative text where appropriate</li>
            <li><strong>Text Alternatives:</strong> Important information is not conveyed by color alone</li>
            <li><strong>Responsive Design:</strong> Our site is designed to work across different screen sizes and devices</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Keyboard,
      title: 'Keyboard Navigation',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our website can be navigated using only a keyboard:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>All interactive elements are accessible via keyboard navigation</li>
            <li>Focus indicators are visible to show which element is currently selected</li>
            <li>Logical tab order is maintained throughout the site</li>
            <li>Keyboard shortcuts are available where appropriate</li>
            <li>No keyboard traps that prevent users from navigating away from elements</li>
          </ul>
        </div>
      ),
    },
    {
      icon: MousePointer,
      title: 'Interactive Elements',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We have designed our interactive elements to be accessible:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Buttons and links have clear labels and purposes</li>
            <li>Form fields include proper labels and error messages</li>
            <li>Clickable areas are large enough to be easily activated</li>
            <li>Interactive elements provide visual feedback when activated</li>
            <li>Forms include clear instructions and validation messages</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Volume2,
      title: 'Screen Reader Support',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We have implemented features to support screen reader users:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Semantic HTML structure for proper content hierarchy</li>
            <li>ARIA labels and roles where appropriate</li>
            <li>Descriptive link text that makes sense out of context</li>
            <li>Proper heading structure (H1, H2, H3, etc.)</li>
            <li>Form labels associated with their input fields</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Accessibility,
      title: 'Ongoing Improvements',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We are continuously working to improve the accessibility of our website:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Regular accessibility audits and testing</li>
            <li>User feedback integration</li>
            <li>Staff training on accessibility best practices</li>
            <li>Monitoring and fixing accessibility issues as they are identified</li>
            <li>Staying current with accessibility standards and guidelines</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Mail,
      title: 'Feedback and Support',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We welcome your feedback on the accessibility of Solar Calculator Canada. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-900 text-sm leading-relaxed mb-2">
              <strong>Contact Information:</strong>
            </p>
            <ul className="list-none text-blue-900 text-sm space-y-1 ml-4">
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:info@solarcalculatorcanada.org"
                  className="text-forest-600 hover:text-forest-700 font-semibold underline"
                >
                  info@solarcalculatorcanada.org
                </a>
              </li>
              <li>
                <strong>Subject Line:</strong> "Accessibility Feedback"
              </li>
            </ul>
          </div>
          <p className="text-gray-700 leading-relaxed mt-4">
            We aim to respond to accessibility feedback within 5 business days. Please include as much detail as possible about the issue you encountered, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>The page or feature where you encountered the issue</li>
            <li>What you were trying to do</li>
            <li>The barrier you encountered</li>
            <li>Your device and browser information (if relevant)</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Accessibility,
      title: 'Third-Party Content',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Some content on our website may be provided by third parties. While we strive to ensure all content meets accessibility standards, we may not have full control over third-party content. If you encounter accessibility issues with third-party content, please let us know and we will work with the content provider to address the issue.
          </p>
        </div>
      ),
    },
    {
      icon: Accessibility,
      title: 'Assistive Technologies',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Our website is designed to work with common assistive technologies, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
            <li>Screen magnification software</li>
            <li>Voice recognition software</li>
            <li>Alternative input devices</li>
            <li>Browser accessibility features and extensions</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            If you use assistive technology and encounter issues, please contact us so we can work together to resolve them.
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
            <Accessibility size={48} className="text-white" />
            <h1 className="heading-lg !text-white">Accessibility</h1>
          </div>
          <p className="text-xl text-white leading-relaxed">
            We are committed to making our website accessible to everyone, regardless of ability. Learn about our accessibility features and how we're working to improve.
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
                At Solar Calculator Canada, we believe that everyone should have equal access to information and services. We are committed to making our website accessible to people with disabilities and ensuring a positive user experience for all visitors.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This page outlines our accessibility features, ongoing improvements, and how to contact us if you encounter any accessibility barriers.
              </p>
            </div>

            {/* Accessibility Sections */}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help or Have Feedback?</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you have questions about accessibility or encounter any barriers while using our website, we want to hear from you:
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
                      <strong>Subject:</strong> "Accessibility Feedback"
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
