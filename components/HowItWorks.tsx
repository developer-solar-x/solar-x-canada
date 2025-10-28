// How It Works section with step-by-step process

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Zap, LineChart, Handshake } from 'lucide-react'
import { useState } from 'react'
import { ImageModal } from './ui/ImageModal'

export function HowItWorks() {
  // State to control image modal visibility
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)

  // Function to open image in modal
  const openImageModal = (src: string, alt: string, title: string) => {
    setSelectedImage({ src, alt, title })
    setImageModalOpen(true)
  }

  // Function to close image modal
  const closeImageModal = () => {
    setImageModalOpen(false)
    setSelectedImage(null)
  }

  // Process steps data
  const steps = [
    {
      number: '01',
      icon: Zap,
      title: 'Choose Your Path',
      description: 'Select Quick Estimate for instant results or Detailed Analysis for precision. Map your roof or pick a size. Upload photos. Add your appliances.',
      color: 'text-red-500',
    },
    {
      number: '02',
      icon: LineChart,
      title: 'See Your Full Picture',
      description: 'View accurate system sizing, costs with incentives, monthly and annual savings, payback timeline, and environmental impact with seasonal production charts.',
      color: 'text-navy-500',
    },
    {
      number: '03',
      icon: Handshake,
      title: 'Get Expert Quotes',
      description: 'Your detailed estimate is sent to vetted local installers. Compare competitive quotes and choose the best fit for your solar journey.',
      color: 'text-red-500',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Decorative wave pattern */}
      <div className="absolute top-0 left-0 right-0 h-32 opacity-10">
        <svg viewBox="0 0 1200 120" className="w-full h-full">
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z"
            fill="currentColor"
            className="text-blue-500"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title block */}
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-4">Your Journey to Solar</h2>
        </div>

        {/* Steps timeline */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200">
            <div className="h-full w-2/3 bg-blue-500"></div>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Large number badge in background */}
              <div className={`absolute -top-8 -left-4 text-8xl font-bold ${step.color} opacity-10 font-display`}>
                {step.number}
              </div>

              {/* Card content */}
              <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                {/* Icon */}
                <div className={`${step.color} mb-6`}>
                  <step.icon size={48} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-navy-500 mb-4">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Visual mockup/screenshot */}
                <div 
                  className={`mt-6 h-40 bg-gray-100 rounded-lg overflow-hidden relative ${
                    index === 0 ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all' : ''
                  }`}
                  onClick={() => {
                    // Only make first image clickable since others are placeholders
                    if (index === 0) {
                      openImageModal('/step1.png', 'Choose your estimate path - Quick or Detailed mode selector', 'Step 1: Choose Your Path')
                    }
                  }}
                  title={index === 0 ? 'Click to view full size' : ''}
                >
                  {index === 0 ? (
                    // First step - Show actual screenshot
                    <Image
                      src="/step1.png"
                      alt="Choose your estimate path - Quick or Detailed mode selector"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    // Other steps - Placeholder
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 text-sm">Screenshot placeholder</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Start Your Estimate
          </Link>
        </div>
      </div>

      {/* Image modal for viewing screenshots */}
      {selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={closeImageModal}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          title={selectedImage.title}
        />
      )}
    </section>
  )
}

