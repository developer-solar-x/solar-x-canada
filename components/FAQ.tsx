'use client'

// FAQ accordion section

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FAQ() {
  // Track which FAQ item is open (only one at a time)
  // Initialize to null to prevent hydration mismatch
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // FAQ questions and answers - Updated for independent platform messaging
  const faqs = [
    {
      question: 'How does this platform work?',
      answer: 'We\'re an independent platform that connects Canadian homeowners with vetted solar installers. You use our free, unbiased calculator to estimate your solar savings. After seeing your results, you can choose to be matched with carefully vetted local installers. We don\'t sell solar systems—we simply facilitate connections between homeowners and quality installers.',
    },
    {
      question: 'How are installers vetted?',
      answer: 'Every installer in our network undergoes a thorough vetting process. We verify certifications (ESA or provincial equivalents), insurance coverage, years of experience, and number of installations completed. We also review past projects and customer references. Only installers who meet our quality standards are approved to join the network.',
    },
    {
      question: 'What is the double warranty?',
      answer: 'The double warranty provides two layers of protection. First, you receive the installer\'s standard warranty covering workmanship and equipment. Second, our platform provides an additional guarantee. If issues arise and the installer doesn\'t resolve them, we step in to help find a solution. This gives you extra peace of mind for your solar investment.',
    },
    {
      question: 'How accurate is the calculator?',
      answer: 'Our calculator uses transparent, verifiable data including satellite imagery, local weather patterns, and current equipment pricing. Estimates are typically within 5-10% of final installation costs. However, a final quote from a vetted installer will account for specific factors like roof condition and electrical panel requirements. All calculations are transparent—you can see how we arrive at your estimates.',
    },
    {
      question: 'Is this calculator really unbiased?',
      answer: 'Yes. We\'re an independent platform with no ties to any solar company. We don\'t make money from installations, so we have no incentive to inflate estimates or push specific products. Our only goal is to provide you with honest, transparent information to help you make an informed decision. The calculator uses objective data and standard industry calculations.',
    },
    {
      question: 'Which provinces are supported?',
      answer: 'Currently, our calculator is fully functional for Ontario, with complete support for HRS rebates and net metering. Alberta is coming soon—we\'re building our installer network there. For other provinces, we show "coming soon" placeholders. You can still use the calculator, but installer matching may be limited until we expand to your province.',
    },
    {
      question: 'What happens after I get my estimate?',
      answer: 'After you see your results, you can choose to be matched with vetted installers in your area. We\'ll share your information (with your permission) with qualified installers who can provide detailed quotes. You can then compare quotes and choose the installer that best fits your needs. There\'s no obligation—you\'re in control of the process.',
    },
    {
      question: 'Do I have to work with installers from your network?',
      answer: 'No, there\'s no obligation. You can use our calculator to get an estimate, and then choose whether or not to be matched with installers. If you do choose to be matched, you can still get quotes from other installers outside our network. We simply provide you with vetted options—the decision is always yours.',
    },
    {
      question: 'What incentives are available in Ontario?',
      answer: 'Ontario offers specific incentives for zero-export solar systems: $100 per kW of solar capacity (up to $5,000 maximum) and $300 per kWh of battery storage (up to $5,000 maximum). Zero-export systems keep all generated power on-site, reducing your grid consumption without sending excess energy back to the utility. Our calculator accounts for these incentives in your estimate.',
    },
    {
      question: 'How long does installation typically take?',
      answer: 'From contract signing to system activation, most installations take 2-4 months. This includes permitting (4-8 weeks), installation (1-3 days), and utility approval (2-6 weeks). Your matched installer will keep you informed throughout every stage. The timeline can vary based on your location and local utility processing times.',
    },
    {
      question: 'Is solar worth it in Ontario\'s climate?',
      answer: 'Absolutely! While Ontario experiences cold winters, solar panels actually perform better in cooler temperatures. We receive ample sunlight throughout the year, and snow typically slides off angled panels. Ontario\'s solar production is comparable to major solar markets like Germany. With zero-export systems, all your generated power directly reduces your electricity bill.',
    },
    {
      question: 'What\'s the typical payback period?',
      answer: 'Most Ontario homeowners see a return on investment in 6-10 years, depending on system size, electricity usage, and available incentives. After that, you\'ll enjoy decades of virtually free electricity. With rising utility rates, solar becomes more valuable every year. Our calculator shows your personalized payback period based on your specific situation.',
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
                  ? 'border-l-4 border-l-maple-500 bg-sky-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Question row - clickable */}
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                suppressHydrationWarning
              >
                <span
                  className={`text-lg font-semibold pr-8 ${
                    openIndex === index ? 'text-forest-500' : 'text-gray-800'
                  }`}
                >
                  {faq.question}
                </span>
                
                <ChevronDown
                  className={`flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180 text-maple-500' : 'text-gray-400'
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

