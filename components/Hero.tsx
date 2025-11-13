'use client'

// Hero section with gradient background and call-to-action

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, CheckCircle, Star, Shield, Award } from 'lucide-react'
import { useState } from 'react'

export function Hero() {
  // State for video modal
  const [videoOpen, setVideoOpen] = useState(false)

  // Trust badges data
  const trustBadges = [
    { icon: CheckCircle, text: '10,000+ Installs' },
    { icon: Star, text: 'Rated 4.9/5' },
    { icon: Shield, text: 'Zero Obligation' },
    { icon: Award, text: 'Ontario Certified' },
  ]

  // Floating statistic cards data
  const stats = [
    { value: '$2,500', label: 'Avg Annual Savings' },
    { value: '6-8 years', label: 'Payback Period' },
    { value: '25-year', label: 'Warranty' },
  ]

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 border border-white rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border border-white rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 border border-white rotate-45" />
      </div>

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-white space-y-6 animate-fade-in">
            {/* Eyebrow text */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-red-500" />
              <p className="eyebrow text-white/90">
                MODERN SOLAR SOLUTIONS
              </p>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-display">
              Power Your Home with Clean Energy
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed">
              Get your personalized solar estimate in minutes. Join thousands of Ontario homeowners saving money and the planet with SolarX.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Primary CTA */}
              <Link
                href="/estimator"
                className="btn-primary h-14 px-8 text-lg inline-flex items-center justify-center"
              >
                Get My Free Estimate
                <ArrowRight className="ml-2" size={20} />
              </Link>

              {/* Secondary CTA - Video */}
              <button
                onClick={() => setVideoOpen(true)}
                className="btn-outline border-white text-white h-14 px-8 text-lg hover:bg-white hover:text-navy-500"
              >
                <Play className="mr-2" size={20} />
                Watch How It Works
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
              {trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-white/90"
                >
                  <badge.icon size={18} className="flex-shrink-0" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Visual with floating cards */}
          <div className="relative hidden lg:block">
            {/* Solar installation hero image */}
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1624397640148-949b1732bb0a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1974"
                alt="Professional solar panel installation on residential roof"
                fill
                className="object-cover"
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 0vw, 50vw"
              />
              {/* Overlay gradient for better card visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating statistic cards */}
            {stats.map((stat, index) => (
              <div
                key={index}
                className="absolute bg-white rounded-xl shadow-xl p-4 animate-float"
                style={{
                  top: `${20 + index * 30}%`,
                  right: index % 2 === 0 ? '-10%' : 'auto',
                  left: index % 2 === 1 ? '-10%' : 'auto',
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <p className="text-2xl font-bold text-navy-500">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setVideoOpen(false)}
        >
          <div className="relative w-full max-w-4xl mx-4">
            {/* Close button */}
            <button
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors"
              onClick={() => setVideoOpen(false)}
            >
              <X size={32} />
            </button>

            {/* Video embed */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="SolarX How It Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}

// Fix X import
function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

