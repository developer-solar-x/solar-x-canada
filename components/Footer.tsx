// Footer component with navigation links and contact info

import Link from 'next/link'
import { Logo } from './Logo'
import { Linkedin, Instagram, Mail, Twitter } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export function Footer() {
  // Social media links
  const socialLinks = [
    { icon: Instagram, href: 'https://www.instagram.com/the.solarcalculatorcanada_org/?hl=en', label: 'Instagram' },
    { icon: Twitter, href: 'https://x.com/SolarCalcuCA25', label: 'Twitter/X' },
    { icon: Linkedin, href: 'https://www.linkedin.com/feed/', label: 'LinkedIn' },
  ]

  // Navigation columns
  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'For Installers', href: '/for-installers' },
    { label: 'Contact', href: '/contact' },
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
            <Logo variant="white" size="lg" framed={false} />
            <p className="mt-6 text-gray-300 leading-relaxed max-w-md">
              Canada's independent platform connecting homeowners with vetted solar installers. Transparent estimates, unbiased matching, and double warranty protection.
            </p>
            
            {/* Social media icons */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
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

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-1 flex-shrink-0" />
                <a
                  href="mailto:info@solarcalculatorcanada.org"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  info@solarcalculatorcanada.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Global disclaimer */}
        <div className="pt-8 border-t border-white/10 mb-8">
          <div className="flex flex-col gap-3 text-xs text-gray-200 max-w-4xl">
            <InfoTooltip
              className="mt-0.5"
              iconSize={18}
              content="All calculations provided on this website are estimates. Actual pricing, production, incentives, fees, and savings may vary. This tool does not guarantee approval for any utility program or government incentive, nor does it eliminate delivery charges or utility service fees. Users should verify all details with a licensed solar professional and their local utility provider."
            />
            <p className="leading-relaxed">
              Estimates only – actual pricing, production, incentives, and savings may differ. See tooltip for
              full details.
            </p>
            <p className="leading-relaxed">
              By using this site and providing your information, you acknowledge that your details may be shared with vetted solar installers for the purpose of contacting you about your estimate. For more details, please see our{' '}
              <Link href="/privacy" className="text-white hover:text-gray-200 underline">
                Privacy Policy
              </Link>.
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
              <Link href="/privacy" className="text-gray-200 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-200 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-gray-200 hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

