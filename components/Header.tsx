'use client'

// Navigation header component with sticky behavior and mobile menu

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from './Logo'
import { Menu, X, ChevronDown, FileText, Building2, Calculator } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const isEstimatorRoute = pathname?.startsWith('/estimator')

  // Mobile menu open/closed state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Tools dropdown open/closed state
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.tools-dropdown-container')) {
          setToolsDropdownOpen(false)
        }
      }
    }

    if (toolsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [toolsDropdownOpen])

  // Handle mobile menu toggle
  const handleToggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Handle mobile menu close
  const handleCloseMenu = () => {
    setMobileMenuOpen(false)
  }

  // Navigation links
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/for-installers', label: 'For Installers' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
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
            <nav className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
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
              
              {/* Tools Dropdown */}
              <div className="relative tools-dropdown-container z-50">
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
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] overflow-hidden">
                      <Link
                        href="/peak-shaving-sales-calculator"
                        onClick={() => setToolsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        <Calculator size={18} className="text-maple-500" />
                        <div>
                          <div className="font-semibold text-sm">Peak Shaving Sales Calculator</div>
                          <div className="text-xs text-gray-500">Professional sales tool</div>
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
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-forest-500 shadow-xl">
            <div className="flex flex-col h-full py-20 px-6">
              {/* Mobile navigation links */}
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium text-white hover:text-maple-300 transition-colors py-2"
                    onClick={handleCloseMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile Tools Links */}
                <div className="pt-2 border-t border-white/20">
                  <div className="text-sm font-semibold text-white/80 mb-2 px-2">Tools</div>
                  <Link
                    href="/peak-shaving-sales-calculator"
                    className="flex items-center gap-3 text-base font-medium text-white hover:text-maple-300 transition-colors py-2 px-2"
                    onClick={handleCloseMenu}
                  >
                    <Calculator size={18} />
                    Peak Shaving Sales Calculator
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

