// Footer component with navigation links and contact info

import Link from 'next/link'
import { Logo } from './Logo'
import { Facebook, Linkedin, Instagram } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export function Footer() {
  // Social media links - removed Solar X specific links, using generic placeholders
  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' },
  ]

  // Navigation columns
  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'For Installers', href: '/for-installers' },
    // { label: 'Contact', href: '/contact' }, // preserved but not currently shown
    { label: 'Calculator', href: '/estimator' },
  ]

  const resources = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Double Warranty', href: '/about#warranty' },
    { label: 'Vetting Process', href: '/about#vetting' },
    { label: 'Help Improve Calculator', href: '/feedback' },
  ]

  return (
    <footer id="contact" className="bg-forest-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main footer content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="lg:col-span-2">
            <Logo variant="white" size="lg" />
            <p className="mt-6 text-gray-300 leading-relaxed max-w-md">
              Canada's independent platform connecting homeowners with vetted solar installers. Transparent estimates, unbiased matching, and double warranty protection.
            </p>
            
            {/* Social media icons */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-maple-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-3">
              {resources.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/*
          // PRESERVED (not rendered): Original Contact column
          // Uncomment and restore icons/imports if you want to show Contact in the footer again.
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-1 flex-shrink-0" />
                <a href="tel:1-800-555-1234" className="text-gray-300 hover:text-white transition-colors">
                  1-800-555-1234
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-1 flex-shrink-0" />
                <a href="mailto:hello@solarcalculatorcanada.org" className="text-gray-300 hover:text-white transition-colors">
                  hello@solarcalculatorcanada.org
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Solar Street<br />
                  Toronto, ON M5V 3A8
                </span>
              </li>
            </ul>
            <p className="text-gray-200 text-sm mt-4">
              Mon-Fri: 8am-6pm EST
            </p>
          </div>
          */}
        </div>

        {/* Global disclaimer */}
        <div className="pt-8 border-t border-white/10 mb-8">
          <div className="flex items-start gap-2 text-xs text-gray-200 max-w-4xl">
            <InfoTooltip
              className="mt-0.5"
              iconSize={18}
              content="All calculations provided on this website are estimates. Actual pricing, production, incentives, fees, and savings may vary. This tool does not guarantee approval for any utility program or government incentive, nor does it eliminate delivery charges or utility service fees. Users should verify all details with a licensed solar professional and their local utility provider."
            />
            <p className="leading-relaxed">
              Estimates only – actual pricing, production, incentives, and savings may differ. See tooltip for
              full details.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-200 text-sm">
              © 2024. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-gray-200 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-200 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-200 hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

