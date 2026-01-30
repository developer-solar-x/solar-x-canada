'use client'

// Navigation header component with sticky behavior and mobile menu

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from './Logo'
import { Menu, X, ChevronDown, FileText, Building2, Calculator, DollarSign, TrendingUp, MapPin, BookOpen, HelpCircle, Mail, Sun } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const isEstimatorRoute = pathname?.startsWith('/estimator')

  // Mobile menu open/closed state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Dropdown open/closed states
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)
  const [solarPowerDropdownOpen, setSolarPowerDropdownOpen] = useState(false)
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false)
  // Mobile dropdown states
  const [mobileSolarPowerOpen, setMobileSolarPowerOpen] = useState(false)
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (toolsDropdownOpen && !target.closest('.tools-dropdown-container')) {
        setToolsDropdownOpen(false)
      }
      if (solarPowerDropdownOpen && !target.closest('.solar-power-dropdown-container')) {
        setSolarPowerDropdownOpen(false)
      }
      if (aboutDropdownOpen && !target.closest('.about-dropdown-container')) {
        setAboutDropdownOpen(false)
      }
    }

    if (toolsDropdownOpen || solarPowerDropdownOpen || aboutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [toolsDropdownOpen, solarPowerDropdownOpen, aboutDropdownOpen])

  // Handle mobile menu toggle
  const handleToggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Handle mobile menu close
  const handleCloseMenu = () => {
    setMobileMenuOpen(false)
  }

  // Top-level navigation links
  const topLevelLinks = [
    { href: '/', label: 'Home' },
    { href: '/for-installers', label: 'For Installers' },
  ]

  return (
    <>
      {/* Main navigation header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isEstimatorRoute ? 'bg-forest-500 shadow-md' : 'bg-white shadow-md'
        }`}
        style={{ height: '64px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo on the left */}
            <Link href="/" className="flex-shrink-0 flex items-center h-full overflow-hidden">
              <Logo 
                variant={isEstimatorRoute ? 'white' : 'default'}
                size="sm"
                showTagline={false}
                framed={isEstimatorRoute}
              />
            </Link>

            {/* Desktop navigation in the center */}
            <nav className="hidden md:flex items-center space-x-4 overflow-visible">
              {topLevelLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isEstimatorRoute
                      ? 'text-white hover:text-maple-300'
                      : 'text-gray-700 hover:text-maple-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Solar Power Dropdown */}
              <div className="relative solar-power-dropdown-container">
                <button
                  onClick={() => {
                    setSolarPowerDropdownOpen(!solarPowerDropdownOpen)
                    setAboutDropdownOpen(false)
                    setToolsDropdownOpen(false)
                  }}
                  className={`text-sm font-medium inline-flex items-center gap-1 transition-colors ${
                    isEstimatorRoute
                      ? 'text-white hover:text-maple-300'
                      : 'text-gray-700 hover:text-maple-500'
                  }`}
                >
                  Solar Power
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${solarPowerDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {solarPowerDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[49]"
                      onClick={() => setSolarPowerDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden">
                      <Link
                        href="/solar-rebates"
                        onClick={() => setSolarPowerDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <DollarSign size={18} className="text-maple-500" />
                        <div>
                          <div className="font-semibold text-sm">Solar Rebates</div>
                          <div className="text-xs text-gray-500">Available incentives</div>
                        </div>
                      </Link>
                      <Link
                        href="/solar-power-cost"
                        onClick={() => setSolarPowerDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <TrendingUp size={18} className="text-forest-500" />
                        <div>
                          <div className="font-semibold text-sm">Solar Power Cost</div>
                          <div className="text-xs text-gray-500">Cost information</div>
                        </div>
                      </Link>
                      <Link
                        href="/solar-energy-maps"
                        onClick={() => setSolarPowerDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <MapPin size={18} className="text-sky-500" />
                        <div>
                          <div className="font-semibold text-sm">Solar Energy in Maps</div>
                          <div className="text-xs text-gray-500">Regional potential</div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* About Dropdown */}
              <div className="relative about-dropdown-container">
                <button
                  onClick={() => {
                    setAboutDropdownOpen(!aboutDropdownOpen)
                    setSolarPowerDropdownOpen(false)
                    setToolsDropdownOpen(false)
                  }}
                  className={`text-sm font-medium inline-flex items-center gap-1 transition-colors ${
                    isEstimatorRoute
                      ? 'text-white hover:text-maple-300'
                      : 'text-gray-700 hover:text-maple-500'
                  }`}
                >
                  About
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${aboutDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {aboutDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[49]"
                      onClick={() => setAboutDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden">
                      <Link
                        href="/blog"
                        onClick={() => setAboutDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <BookOpen size={18} className="text-maple-500" />
                        <div>
                          <div className="font-semibold text-sm">Blog</div>
                          <div className="text-xs text-gray-500">Solar guides & news</div>
                        </div>
                      </Link>
                      <Link
                        href="/how-it-works"
                        onClick={() => setAboutDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <Sun size={18} className="text-forest-500" />
                        <div>
                          <div className="font-semibold text-sm">How It Works</div>
                          <div className="text-xs text-gray-500">Our process</div>
                        </div>
                      </Link>
                      <Link
                        href="/faqs"
                        onClick={() => setAboutDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <HelpCircle size={18} className="text-sky-500" />
                        <div>
                          <div className="font-semibold text-sm">FAQs</div>
                          <div className="text-xs text-gray-500">Common questions</div>
                        </div>
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setAboutDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <Mail size={18} className="text-amber-500" />
                        <div>
                          <div className="font-semibold text-sm">Contact Us</div>
                          <div className="text-xs text-gray-500">Get in touch</div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>
              
              {/* Tools Dropdown */}
              <div className="relative tools-dropdown-container">
                <button
                  onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  className={`text-sm font-medium inline-flex items-center gap-1 transition-colors ${
                    isEstimatorRoute
                      ? 'text-white hover:text-maple-300'
                      : 'text-gray-700 hover:text-maple-500'
                  }`}
                >
                  Tools
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {toolsDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[49]"
                      onClick={() => setToolsDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden">
                      <Link
                        href="/peak-shaving-calculator"
                        onClick={() => setToolsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <Calculator size={18} className="text-maple-500" />
                        <div>
                          <div className="font-semibold text-sm">Peak Shaving Calculator</div>
                          <div className="text-xs text-gray-500">Professional tool</div>
                        </div>
                      </Link>
                      <Link
                        href="/for-installers/apply/track"
                        onClick={() => setToolsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <Building2 size={18} className="text-forest-500" />
                        <div>
                          <div className="font-semibold text-sm">Track My Application</div>
                          <div className="text-xs text-gray-500">Installer application status</div>
                        </div>
                      </Link>
                      <Link
                        href="/track"
                        onClick={() => setToolsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-100"
                      >
                        <FileText size={18} className="text-sky-500" />
                        <div>
                          <div className="font-semibold text-sm">Track My Estimate</div>
                          <div className="text-xs text-gray-500">Solar estimate results</div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* CTA button on the right */}
            <div className="hidden md:flex items-center">
              <Link
                href="/estimator"
                className="btn-primary text-sm"
              >
                Get Free Estimate
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isEstimatorRoute
                ? 'text-white hover:bg-white/10'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
              onClick={handleToggleMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Dark overlay behind menu */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseMenu}
          />
          
          {/* Slide-in menu panel */}
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-forest-500 shadow-xl overflow-y-auto">
            <div className="flex flex-col h-full py-20 px-6">
              {/* Mobile navigation links */}
              <nav className="flex flex-col space-y-4">
                {topLevelLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium text-white hover:text-maple-300 transition-colors py-2"
                    onClick={handleCloseMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile Solar Power Dropdown */}
                <div className="pt-2 border-t border-white/20">
                  <button
                    onClick={() => setMobileSolarPowerOpen(!mobileSolarPowerOpen)}
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-maple-300 transition-colors py-2"
                  >
                    <span>Solar Power</span>
                    <ChevronDown 
                      size={18} 
                      className={`transition-transform ${mobileSolarPowerOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {mobileSolarPowerOpen && (
                    <div className="pl-4 mt-2 space-y-2">
                      <Link
                        href="/solar-rebates"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <DollarSign size={16} />
                        Solar Rebates
                      </Link>
                      <Link
                        href="/solar-power-cost"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <TrendingUp size={16} />
                        Solar Power Cost
                      </Link>
                      <Link
                        href="/solar-energy-maps"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <MapPin size={16} />
                        Solar Energy in Maps
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile About Dropdown */}
                <div className="pt-2 border-t border-white/20">
                  <button
                    onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-maple-300 transition-colors py-2"
                  >
                    <span>About</span>
                    <ChevronDown 
                      size={18} 
                      className={`transition-transform ${mobileAboutOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {mobileAboutOpen && (
                    <div className="pl-4 mt-2 space-y-2">
                      <Link
                        href="/blog"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <BookOpen size={16} />
                        Blog
                      </Link>
                      <Link
                        href="/how-it-works"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <Sun size={16} />
                        How It Works
                      </Link>
                      <Link
                        href="/faqs"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <HelpCircle size={16} />
                        FAQs
                      </Link>
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 text-base font-medium text-white/90 hover:text-maple-300 transition-colors py-2"
                        onClick={handleCloseMenu}
                      >
                        <Mail size={16} />
                        Contact Us
                      </Link>
                    </div>
                  )}
                </div>
                
                {/* Mobile Tools Links */}
                <div className="pt-2 border-t border-white/20">
                  <div className="text-sm font-semibold text-white/80 mb-2 px-2">Tools</div>
                  <Link
                    href="/peak-shaving-calculator"
                    className="flex items-center gap-3 text-base font-medium text-white hover:text-maple-300 transition-colors py-2 px-2"
                    onClick={handleCloseMenu}
                  >
                    <Calculator size={18} />
                    Peak Shaving Calculator
                  </Link>
                  <Link
                    href="/for-installers/apply/track"
                    className="flex items-center gap-3 text-base font-medium text-white hover:text-maple-300 transition-colors py-2 px-2"
                    onClick={handleCloseMenu}
                  >
                    <Building2 size={18} />
                    Track My Application
                  </Link>
                  <Link
                    href="/track"
                    className="flex items-center gap-3 text-base font-medium text-white hover:text-maple-300 transition-colors py-2 px-2"
                    onClick={handleCloseMenu}
                  >
                    <FileText size={18} />
                    Track My Estimate
                  </Link>
                </div>
              </nav>

              {/* Mobile CTA button */}
              <div className="mt-8">
                <Link
                  href="/estimator"
                  className="btn-primary w-full text-center"
                  onClick={handleCloseMenu}
                >
                  Get Free Estimate
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

