'use client'

// Installer help/documentation page

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Book, 
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function InstallerHelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I apply to join the installer network?',
      answer: 'Click the "Apply to Join" button on the For Installers page and complete the application form. You\'ll need to provide company information, certifications, insurance details, and service areas. The review process typically takes 2-3 business days.',
    },
    {
      category: 'Getting Started',
      question: 'What documents do I need to apply?',
      answer: 'You\'ll need: proof of provincial electrical certification (ESA in Ontario), manufacturer certifications, proof of general liability insurance, and information about your service areas and experience.',
    },
    {
      category: 'Leads',
      question: 'How are leads matched to installers?',
      answer: 'Leads are matched based on your service area coverage. Homeowners in your defined service areas will see you as a potential installer match. The platform considers location, system size preferences, and other factors.',
    },
    {
      category: 'Leads',
      question: 'How quickly should I respond to leads?',
      answer: 'We recommend responding to new leads within 24 hours. Faster response times typically lead to higher conversion rates. The dashboard shows your average response time.',
    },
    {
      category: 'Leads',
      question: 'Can I see lead details before contacting them?',
      answer: 'Yes! Each lead includes property address, system size, energy usage, estimated savings, and contact information. You can view full details and add notes in the lead detail page.',
    },
    {
      category: 'Profile & Settings',
      question: 'How do I update my service areas?',
      answer: 'Go to your Dashboard > Service Areas. You can add new service areas by province, define coverage by radius from a central location, or specify postal code prefixes.',
    },
    {
      category: 'Profile & Settings',
      question: 'How do I upload project photos?',
      answer: 'Navigate to Dashboard > Project Gallery. Click "Upload Photos" and select images from your completed installations. You can organize photos by category (residential, commercial, battery storage).',
    },
    {
      category: 'Profile & Settings',
      question: 'What if my certifications expire?',
      answer: 'You\'ll receive email reminders before certifications expire. Upload updated certificates in your Profile > Certifications section. Expired certifications may affect your ability to receive new leads.',
    },
    {
      category: 'Billing & Plans',
      question: 'How does billing work?',
      answer: 'Billing depends on your plan. Starter plan is free. Professional plan is $99/month. Enterprise plans have custom pricing. You can upgrade or downgrade your plan at any time from your dashboard.',
    },
    {
      category: 'Billing & Plans',
      question: 'Can I change my plan?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately. Contact support if you need assistance with plan changes.',
    },
    {
      category: 'Support',
      question: 'How do I contact support?',
      answer: 'You can contact support via email at support@solarcalculatorcanada.ca, through the contact form, or by phone during business hours. Response time is typically within 24 hours.',
    },
    {
      category: 'Support',
      question: 'What if I have technical issues?',
      answer: 'For technical issues with the platform, contact our support team. Include screenshots and details about the problem. We typically resolve technical issues within 1-2 business days.',
    },
  ]

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index.toString())) {
      newExpanded.delete(index.toString())
    } else {
      newExpanded.add(index.toString())
    }
    setExpandedItems(newExpanded)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-16 bg-forest-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-6">
            Help & Documentation
          </h1>
          <p className="text-xl text-white/90">
            Find answers to common questions and learn how to use the platform
          </p>
        </div>
      </section>

      {/* Help Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-forest-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="space-y-4 mb-12">
            {filteredFAQs.map((faq, index) => {
              const isExpanded = expandedItems.has(index.toString())
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-forest-600 font-semibold mb-1">
                        {faq.category}
                      </div>
                      <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                    ) : (
                      <ChevronRight className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-md text-center">
              <p className="text-gray-600">No results found. Try a different search term.</p>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <Book className="text-forest-500" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Documentation</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Getting Started Guide</li>
                <li>• Lead Management Best Practices</li>
                <li>• Profile Optimization Tips</li>
                <li>• Platform Features Overview</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="text-forest-500" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Contact Support</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={16} className="text-gray-400" />
                  <a href="mailto:support@solarcalculatorcanada.ca" className="text-forest-600 hover:text-forest-700">
                    support@solarcalculatorcanada.ca
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={16} className="text-gray-400" />
                  <span>1-800-SOLAR-HELP</span>
                </div>
                <Link href="/contact" className="btn-outline text-sm inline-flex items-center mt-3">
                  Contact Form
                </Link>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-sky-50 rounded-xl p-8 border border-sky-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Lead Response</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Respond within 24 hours</li>
                  <li>Personalize your message</li>
                  <li>Include relevant project examples</li>
                  <li>Follow up appropriately</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Profile Optimization</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Keep certifications up to date</li>
                  <li>Upload quality project photos</li>
                  <li>Respond to customer reviews</li>
                  <li>Maintain accurate service areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

