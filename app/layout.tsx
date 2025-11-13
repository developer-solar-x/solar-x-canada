import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PreconnectLinks } from '@/components/PreconnectLinks'

// Metadata for SEO optimization - Optimized for Canadian solar market
export const metadata: Metadata = {
  metadataBase: new URL('https://www.solarcalculatorcanada.org'),
  title: 'Free Solar Calculator Canada | Solar Panel Cost & Savings Estimate 2025',
  description: 'Get your free solar panel estimate for Canada. Calculate solar costs, savings, and ROI instantly. Compare with OpenSolar, Sunly, and WOWA. Get accurate quotes for Ontario, BC, Alberta & all provinces. No commitment required.',
  keywords: [
    // Primary keywords
    'solar calculator canada',
    'solar panel calculator canada',
    'solar estimate canada',
    'solar cost calculator canada',
    'solar savings calculator canada',
    // Location-specific
    'solar panels ontario',
    'solar panels toronto',
    'solar panels vancouver',
    'solar panels calgary',
    'solar panels edmonton',
    'solar panels montreal',
    'solar panels ottawa',
    // Competitor comparison keywords
    'solar calculator vs opensolar',
    'solar calculator vs sunly',
    'solar calculator vs wowa',
    'best solar calculator canada',
    // Service keywords
    'solar installation canada',
    'solar panel installation canada',
    'solar energy canada',
    'residential solar canada',
    'home solar canada',
    'solar rebates canada',
    'solar incentives canada',
    'solar financing canada',
    // Long-tail keywords
    'how much do solar panels cost in canada',
    'solar panel payback period canada',
    'solar panel savings calculator',
    'free solar quote canada',
    'solar panel estimate ontario',
  ],
  authors: [{ name: 'SolarX Canada' }],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://www.solarcalculatorcanada.org',
    siteName: 'SolarX - Free Solar Calculator Canada',
    title: 'Free Solar Calculator Canada | Solar Panel Cost & Savings Estimate 2025',
    description: 'Get your free solar panel estimate for Canada. Calculate solar costs, savings, and ROI instantly. Compare with OpenSolar, Sunly, and WOWA. No commitment required.',
    countryName: 'Canada',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Solar Calculator Canada | Solar Panel Cost & Savings Estimate',
    description: 'Get your free solar panel estimate for Canada. Calculate solar costs, savings, and ROI instantly.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
  other: {
    // Preconnect to external domains for faster loading
    'dns-prefetch': 'https://images.unsplash.com',
  },
}

// Viewport configuration (Next.js 15 requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Structured Data for SEO (JSON-LD) - These are rendered in the body (valid HTML5)
  const organizationSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SolarX',
    url: 'https://www.solarcalculatorcanada.org',
    logo: 'https://www.solarcalculatorcanada.org/logo.png',
    description: 'Free solar panel calculator and estimate tool for Canadian homeowners. Calculate solar costs, savings, and ROI instantly.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
  })

  const websiteSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SolarX - Free Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    description: 'Free solar panel calculator and estimate tool for Canadian homeowners',
    inLanguage: 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.solarcalculatorcanada.org/estimator?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  })

  const serviceSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Solar Panel Installation Consultation',
    provider: {
      '@type': 'Organization',
      name: 'SolarX',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    description: 'Free solar panel cost and savings calculator for Canadian homeowners. Get instant estimates for solar panel installation costs, savings, and ROI.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
      description: 'Free solar estimate and calculator',
    },
  })

  return (
    <html lang="en-CA" className="scroll-smooth">
      <body className="antialiased">
        {/* Preconnect links for performance - added early in body */}
        <PreconnectLinks />
        {/* Structured Data for SEO (JSON-LD) - Valid in body for HTML5 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationSchema }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteSchema }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serviceSchema }}
        />
        {children}
      </body>
    </html>
  )
}

