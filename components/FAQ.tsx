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
      question: 'How accurate is the estimate?',
      answer: 'Our estimates are highly accurate, typically within 5-10% of final installation costs. We use advanced satellite imagery, local weather data, and real-time equipment pricing to provide you with reliable projections. However, a final quote from an installer will account for specific factors like roof condition and electrical panel requirements.',
    },
    {
      question: 'What incentives are available for zero-export systems in Ontario?',
      answer: 'Ontario offers specific incentives for zero-export solar systems: $100 per kW of solar capacity (up to $5,000 maximum) and $300 per kWh of battery storage (up to $5,000 maximum). Zero-export systems keep all generated power on-site, reducing your grid consumption without sending excess energy back to the utility. We\'ll help you maximize these incentives during your consultation.',
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
      answer: 'Absolutely! While Ontario experiences cold winters, solar panels actually perform better in cooler temperatures. We receive ample sunlight throughout the year, and snow typically slides off angled panels. Ontario\'s solar production is comparable to major solar markets like Germany. With zero-export systems, all your generated power directly reduces your electricity bill.',
    },
    {
      question: 'What\'s the typical payback period?',
      answer: 'Most Ontario homeowners see a return on investment in 6-10 years, depending on system size, electricity usage, and available incentives. After that, you\'ll enjoy decades of virtually free electricity. With rising utility rates, solar becomes more valuable every year.',
    },
    {
      question: 'What is a zero-export solar system?',
      answer: 'A zero-export system is designed to keep all generated solar power on your property without sending excess energy back to the utility grid. These systems use smart inverters to limit production to match your consumption in real-time, or store excess energy in batteries. This approach qualifies for specific Ontario incentives and eliminates utility interconnection complexities.',
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-4">Your Questions, Answered</h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about going solar
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

