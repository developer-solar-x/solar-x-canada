'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'

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
    <div className="space-y-4 max-w-4xl">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className={`group relative bg-white rounded-2xl border transition-all duration-500 ${
              isOpen 
                ? 'border-forest-300 shadow-xl shadow-forest-100/50' 
                : 'border-gray-200 hover:border-forest-200 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Decorative gradient line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-500 via-blue-500 to-forest-500 rounded-t-2xl transition-opacity duration-500 ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`} />
            
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-8 py-6 flex items-start justify-between text-left group/button"
            >
              <div className="flex items-start gap-5 flex-1">
                {/* Icon circle */}
                <div className={`relative flex-shrink-0 transition-all duration-500 ${
                  isOpen ? 'scale-110' : 'scale-100'
                }`}>
                  <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-500 ${
                    isOpen 
                      ? 'bg-gradient-to-br from-forest-400 to-blue-400 opacity-40' 
                      : 'bg-gray-300 opacity-0 group-hover/button:opacity-20'
                  }`} />
                  <div className={`relative p-3 rounded-xl transition-all duration-500 ${
                    isOpen
                      ? 'bg-gradient-to-br from-forest-500 to-blue-500 shadow-lg'
                      : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover/button:from-forest-50 group-hover/button:to-blue-50'
                  }`}>
                    <HelpCircle 
                      size={22} 
                      className={`transition-colors duration-500 ${
                        isOpen ? 'text-white' : 'text-gray-600 group-hover/button:text-forest-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Question text */}
                <div className="flex-1 pt-0.5">
                  <h3 className={`text-xl font-bold leading-snug transition-colors duration-300 ${
                    isOpen 
                      ? 'text-forest-700' 
                      : 'text-gray-900 group-hover/button:text-forest-600'
                  }`}>
                    {item.question}
                  </h3>
                </div>
              </div>

              {/* Chevron */}
              <div className="flex-shrink-0 ml-4">
                <div className={`p-2 rounded-lg transition-all duration-500 ${
                  isOpen 
                    ? 'bg-forest-100 rotate-180' 
                    : 'bg-transparent group-hover/button:bg-gray-100'
                }`}>
                  <ChevronDown
                    size={20}
                    className={`transition-colors duration-300 ${
                      isOpen ? 'text-forest-600' : 'text-gray-500 group-hover/button:text-forest-600'
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Answer content */}
            <div className={`overflow-hidden transition-all duration-500 ${
              isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-8 pb-8 pt-2">
                <div className="pl-[68px] space-y-4 text-gray-700 leading-relaxed">
                  {item.answer.split('\n').map((line, i) => {
                    const trimmedLine = line.trim()
                    if (!trimmedLine) return null

                    // Enhanced formatting with visual indicators
                    if (line.includes('✅')) {
                      return (
                        <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <CheckCircle size={18} className="text-green-600" />
                          </div>
                          <p className="text-base text-gray-800 font-medium pt-0.5">{line.replace('✅', '').trim()}</p>
                        </div>
                      )
                    }
                    if (line.includes('💡')) {
                      return (
                        <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm">
                          <div className="p-1.5 bg-amber-100 rounded-lg">
                            <Lightbulb size={18} className="text-amber-600" />
                          </div>
                          <p className="text-base text-gray-800 pt-0.5">{line.replace('💡', '').trim()}</p>
                        </div>
                      )
                    }
                    if (line.includes('⚠️')) {
                      return (
                        <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 shadow-sm">
                          <div className="p-1.5 bg-red-100 rounded-lg">
                            <AlertCircle size={18} className="text-red-600" />
                          </div>
                          <p className="text-base text-gray-800 pt-0.5">{line.replace('⚠️', '').trim()}</p>
                        </div>
                      )
                    }
                    return (
                      <p key={i} className="text-base text-gray-700">
                        {line}
                      </p>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
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
