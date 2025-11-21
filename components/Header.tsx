'use client'

// Navigation header component with sticky behavior and mobile menu

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'
import { Menu, X } from 'lucide-react'

export function Header() {
  // Track scroll position for sticky header styling
  const [scrolled, setScrolled] = useState(false)
  // Mobile menu open/closed state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Add scroll listener for header background change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          scrolled
            ? 'bg-white shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo on the left */}
            <Link href="/" className="flex-shrink-0">
              <Logo 
                variant={scrolled ? 'default' : 'white'} 
                size="md"
                showTagline={false}
              />
            </Link>

            {/* Desktop navigation in the center */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-maple-500 ${
                    scrolled ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
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
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
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

