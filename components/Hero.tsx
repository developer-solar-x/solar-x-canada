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
    { icon: Shield, text: 'Vetted Installers' },
    { icon: CheckCircle, text: 'Double Warranty' },
    { icon: Star, text: 'Unbiased Calculator' },
    { icon: Award, text: 'Consumer Protection' },
  ]
  
  // Province availability
  const provinces = [
    { name: 'Ontario', status: 'active', description: 'Fully functional' },
    { name: 'Alberta', status: 'coming-soon', description: 'Coming soon' },
  ]

  // Floating statistic cards data
  const stats = [
    { value: '$2,500', label: 'Avg Annual Savings' },
    { value: '6-8 years', label: 'Payback Period' },
    { value: '25-year', label: 'Warranty' },
  ]

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-forest-500">
      {/* Professional background with subtle depth */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Subtle texture overlay for depth */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* Subtle light accent in corner */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Bottom fade to white for smooth transition - shorter and more subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-white space-y-6 animate-fade-in relative z-20">
            {/* Eyebrow text */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-maple-400 rounded-full" />
              <p className="eyebrow text-white/90 tracking-wider">
                INDEPENDENT PLATFORM
              </p>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-display text-white drop-shadow-lg">
              Canada's Independent Solar Savings Calculator & Installer Match
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/90 max-w-xl leading-relaxed">
              Get an unbiased solar estimate and connect with vetted installers. Free, no-obligation calculator with transparent data and double warranty protection.
            </p>

            {/* CTA buttons */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary CTA */}
                <Link
                  href="/estimator"
                  className="btn-primary h-14 px-8 text-lg inline-flex items-center justify-center"
                >
                  Check Your Solar Savings
                  <ArrowRight className="ml-2" size={20} />
                </Link>

                {/* Secondary CTA */}
                <Link
                  href="#how-it-works"
                  className="btn-outline border-white text-white h-14 px-8 text-lg hover:bg-white hover:text-forest-500"
                >
                  Learn How It Works
                </Link>
              </div>

              {/* Installer CTA */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-white/20"></div>
                <p className="text-sm text-white/80">Are you an installer?</p>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>
              <Link
                href="/for-installers"
                className="btn-outline border-white/50 text-white h-12 px-6 text-base hover:bg-white/10 hover:border-white inline-flex items-center justify-center w-full sm:w-auto"
              >
                Join Our Installer Network
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </div>

            {/* Trust badges with professional styling */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
              {trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 text-sm text-white/95 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
                >
                  <badge.icon size={18} className="flex-shrink-0 text-maple-300" />
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
            
            {/* Province availability section */}
            <div className="pt-8 border-t border-white/10 relative z-20">
              <p className="text-sm text-white/90 mb-3 font-semibold">Available in:</p>
              <div className="flex flex-wrap gap-3">
                {provinces.map((province, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                      province.status === 'active'
                        ? 'bg-maple-500/30 text-white border-2 border-maple-300/50 shadow-lg shadow-maple-500/20'
                        : 'bg-white/15 text-white/90 border-2 border-white/30'
                    }`}
                  >
                    <span>{province.name}</span>
                    {province.status === 'active' && (
                      <span className="w-2.5 h-2.5 bg-maple-300 rounded-full animate-pulse shadow-sm shadow-maple-300/50" />
                    )}
                    {province.status === 'coming-soon' && (
                      <span className="text-xs opacity-80 font-normal">({province.description})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Visual with floating cards */}
          <div className="relative hidden lg:block z-10">
            {/* Solar installation hero image */}
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10">
              <Image
                src="https://images.unsplash.com/photo-1624397640148-949b1732bb0a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1974"
                alt="Professional solar panel installation on residential roof"
                fill
                className="object-cover"
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 0vw, 50vw"
              />
              {/* Subtle overlay for better card visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            {/* Floating statistic cards with professional styling */}
            {stats.map((stat, index) => (
              <div
                key={index}
                className="absolute bg-white rounded-xl shadow-2xl p-5 animate-float backdrop-blur-sm border border-white/20"
                style={{
                  top: `${20 + index * 30}%`,
                  right: index % 2 === 0 ? '-10%' : 'auto',
                  left: index % 2 === 1 ? '-10%' : 'auto',
                  animationDelay: `${index * 0.2}s`,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <p className="text-2xl font-bold text-forest-600">{stat.value}</p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
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
              className="absolute -top-12 right-0 text-white hover:text-maple-500 transition-colors"
              onClick={() => setVideoOpen(false)}
            >
              <X size={32} />
            </button>

            {/* Video embed */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="How It Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll indicator with subtle styling */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-2 text-white/70 animate-bounce">
          <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
          <svg
            className="w-5 h-5"
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

