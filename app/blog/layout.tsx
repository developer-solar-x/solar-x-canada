import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Solar Energy Blog | Expert Guides, Tips & News | Solar Calculator Canada',
  description:
    'Expert solar energy guides, tips, and news for Canadian homeowners. Learn about solar panels, battery storage, net metering, costs, incentives, and more. Stay informed about the latest in solar technology.',
  keywords: [
    'solar blog',
    'solar energy blog canada',
    'solar panel guides',
    'solar tips',
    'solar news canada',
    'solar information',
    'solar education',
    'solar articles',
  ],
  openGraph: {
    title: 'Solar Energy Blog | Expert Guides & Tips | Solar Calculator Canada',
    description:
      'Expert solar energy guides, tips, and news for Canadian homeowners. Learn about solar panels, battery storage, net metering, and more.',
    type: 'website',
    url: 'https://www.solarcalculatorcanada.org/blog',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
