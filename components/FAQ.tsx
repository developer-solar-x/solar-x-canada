'use client'

// FAQ accordion section

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FAQ() {
  // Track which FAQ item is open (only one at a time)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  // FAQ questions and answers
  const faqs = [
    {
      question: 'How accurate is the SolarX estimate?',
      answer: 'Our estimates are highly accurate, typically within 5-10% of final installation costs. We use advanced satellite imagery, local weather data, and real-time equipment pricing to provide you with reliable projections. However, a final quote from an installer will account for specific factors like roof condition and electrical panel requirements.',
    },
    {
      question: 'What incentives are available in Ontario?',
      answer: 'Ontario homeowners can access several incentives including the federal Greener Homes Grant (up to $5,000), net metering credits, and accelerated capital cost allowance for businesses. Additionally, some municipalities offer property tax exemptions for solar installations. We\'ll help you identify all applicable programs during your consultation.',
    },
    {
      question: 'Do I need to own my home to go solar?',
      answer: 'Yes, you typically need to be the homeowner to install a solar system, as it requires permission to modify the property and involves a long-term investment. However, if you\'re a long-term renter, you could discuss portable solar options with your landlord. Community solar programs are also emerging for renters and condo dwellers.',
    },
    {
      question: 'How long does installation typically take?',
      answer: 'From contract signing to system activation, most installations take 2-4 months. This includes permitting (4-8 weeks), installation (1-3 days), and utility approval (2-6 weeks). We\'ll keep you informed throughout every stage, and our experienced team ensures a smooth process.',
    },
    {
      question: 'What if my roof isn\'t suitable for solar?',
      answer: 'Not every roof is ideal for solar, but we have solutions! If your roof faces north, has too much shade, or needs replacement soon, we can recommend alternatives like ground-mount systems, solar canopies, or delaying installation until after roof work. Our free assessment will provide honest guidance.',
    },
    {
      question: 'Is solar worth it in Ontario\'s climate?',
      answer: 'Absolutely! While Ontario experiences cold winters, solar panels actually perform better in cooler temperatures. We receive ample sunlight throughout the year, and snow typically slides off angled panels. Ontario\'s solar production is comparable to major solar markets like Germany. Plus, net metering ensures you get credit for excess summer production.',
    },
    {
      question: 'What\'s the typical payback period?',
      answer: 'Most Ontario homeowners see a return on investment in 6-10 years, depending on system size, electricity usage, and available incentives. After that, you\'ll enjoy decades of virtually free electricity. With rising utility rates, solar becomes more valuable every year.',
    },
    {
      question: 'How does net metering work in Ontario?',
      answer: 'Net metering allows you to send excess solar energy to the grid in exchange for credits. During sunny months, you\'ll likely produce more than you use, building up credits. In winter, when production is lower, those credits offset your electricity costs. It\'s essentially using the grid as a battery.',
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-4">Your Questions, Answered</h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about going solar with SolarX
          </p>
        </div>

        {/* Accordion items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-xl transition-all ${
                openIndex === index
                  ? 'border-l-4 border-l-red-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Question row - clickable */}
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span
                  className={`text-lg font-semibold pr-8 ${
                    openIndex === index ? 'text-navy-500' : 'text-gray-800'
                  }`}
                >
                  {faq.question}
                </span>
                
                <ChevronDown
                  className={`flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180 text-red-500' : 'text-gray-400'
                  }`}
                  size={24}
                />
              </button>

              {/* Answer panel - expandable */}
              {openIndex === index && (
                <div className="px-6 pb-5 animate-fade-in">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

