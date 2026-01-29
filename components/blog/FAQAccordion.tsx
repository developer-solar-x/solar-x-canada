'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItem[]
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="group border-2 border-gray-200 rounded-xl overflow-hidden hover:border-forest-400 transition-all duration-300 hover:shadow-md"
        >
          <button
            onClick={() => toggleAccordion(index)}
            className="w-full px-6 py-4 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white hover:from-forest-50 hover:to-blue-50 transition-colors duration-300 text-left"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1 p-2 rounded-lg bg-forest-100 text-forest-600 flex-shrink-0">
                <HelpCircle size={18} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug pr-4">
                {item.question}
              </h3>
            </div>
            <ChevronDown
              size={24}
              className={`flex-shrink-0 text-forest-600 transition-transform duration-300 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openIndex === index && (
            <div className="px-6 py-5 bg-white border-t-2 border-forest-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-gray-700 leading-relaxed space-y-3">
                {item.answer.split('\n').map((line, i) => (
                  <p key={i} className="text-base">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Component to parse FAQ section from markdown
export function FAQSection({ faqContent }: { faqContent: string }) {
  const faqItems: FAQItem[] = []

  // Parse FAQ items from markdown
  const lines = faqContent.split('\n')
  let currentQuestion = ''
  let currentAnswer = ''
  let inAnswer = false

  lines.forEach((line) => {
    if (line.startsWith('### Q:')) {
      if (currentQuestion) {
        faqItems.push({
          question: currentQuestion.replace('### Q: ', ''),
          answer: currentAnswer.replace('**A**: ', '').trim(),
        })
      }
      currentQuestion = line
      currentAnswer = ''
      inAnswer = false
    } else if (currentQuestion && line.startsWith('**A**:')) {
      currentAnswer = line
      inAnswer = true
    } else if (inAnswer && line.trim()) {
      currentAnswer += '\n' + line
    }
  })

  // Add the last FAQ item
  if (currentQuestion) {
    faqItems.push({
      question: currentQuestion.replace('### Q: ', ''),
      answer: currentAnswer.replace('**A**: ', '').trim(),
    })
  }

  return <FAQAccordion items={faqItems} />
}
