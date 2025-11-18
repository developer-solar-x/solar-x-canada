import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PreconnectLinks } from '@/components/PreconnectLinks'

// Metadata for SEO optimization - Optimized for Canadian solar market
export const metadata: Metadata = {
  metadataBase: new URL('https://www.solarcalculatorcanada.org'),
  title: 'Free Solar Calculator Canada | Rooftop Solar Calculator, Peak Shaving & Net Metering 2025',
  description: 'Free solar calculator for Canada. Calculate rooftop solar, peak shaving, net metering, battery storage, system sizing, costs, savings, and ROI. Get instant solar panel estimates.',
  keywords: [
    // Primary calculator keywords
    'solar calculator canada',
    'solar panel calculator canada',
    'rooftop solar calculator',
    'rooftop calculator',
    'solar rooftop calculator canada',
    'solar system calculator',
    'solar panel sizing calculator',
    'solar energy calculator',
    'solar power calculator',
    'solar estimate calculator',
    'solar cost calculator canada',
    'solar savings calculator canada',
    // Peak shaving & battery keywords
    'peak shaving calculator',
    'solar peak shaving calculator',
    'battery peak shaving calculator',
    'peak shaving canada',
    'solar battery calculator',
    'battery storage calculator',
    'solar battery sizing calculator',
    'home battery calculator',
    'solar plus battery calculator',
    'battery backup calculator',
    // Net metering keywords
    'net metering calculator',
    'net metering canada',
    'solar net metering calculator',
    'net metering calculator ontario',
    'net metering vs zero export',
    'zero export solar calculator',
    'solar export calculator',
    // System design keywords
    'solar system sizing',
    'solar panel system calculator',
    'solar array calculator',
    'solar panel configuration calculator',
    'solar inverter sizing calculator',
    'solar panel orientation calculator',
    'solar panel tilt calculator',
    'solar panel azimuth calculator',
    // Location-specific
    'solar calculator ontario',
    'solar calculator toronto',
    'solar calculator vancouver',
    'solar calculator calgary',
    'solar calculator edmonton',
    'solar calculator montreal',
    'solar calculator ottawa',
    'solar panels ontario',
    'solar panels toronto',
    // Service & installation keywords
    'solar installation canada',
    'solar panel installation canada',
    'residential solar canada',
    'home solar canada',
    'solar energy canada',
    'solar power canada',
    // Financial keywords
    'solar rebates canada',
    'solar incentives canada',
    'solar financing canada',
    'solar roi calculator',
    'solar payback calculator',
    'solar investment calculator',
    // Long-tail keywords
    'how much do solar panels cost in canada',
    'solar panel payback period canada',
    'how many solar panels do i need calculator',
    'solar panel cost per watt calculator',
    'solar panel production calculator',
    'solar panel output calculator',
    'solar panel efficiency calculator',
    'free solar quote canada',
    'solar panel estimate ontario',
    'best solar calculator canada',
    'accurate solar calculator',
  ],
  authors: [{ name: 'Solar Calculator Canada' }],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://www.solarcalculatorcanada.org',
    siteName: 'Free Solar Calculator Canada',
    title: 'Free Solar Calculator Canada | Rooftop Solar Calculator, Peak Shaving & Net Metering 2025',
    description: 'Free solar calculator for Canada. Calculate rooftop solar, peak shaving, net metering, battery storage, system sizing, costs, savings, and ROI. Get instant solar panel estimates.',
    countryName: 'Canada',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Solar Calculator Canada | Rooftop Solar Calculator, Peak Shaving & Net Metering',
    description: 'Free solar calculator for Canada. Calculate rooftop solar, peak shaving, net metering, battery storage, system sizing, costs, savings, and ROI. Get instant solar panel estimates.',
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
    name: 'Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    logo: 'https://www.solarcalculatorcanada.org/logo.png',
    description: 'Free solar calculator and estimate tool for Canadian homeowners. Calculate rooftop solar systems, peak shaving, net metering, battery storage, system sizing, costs, savings, and ROI instantly.',
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
    name: 'Free Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    description: 'Free solar calculator and estimate tool for Canadian homeowners. Calculate rooftop solar, peak shaving, net metering, battery storage, and system sizing.',
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
      name: 'Solar Calculator Canada',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    description: 'Free solar calculator for Canadian homeowners. Calculate rooftop solar systems, peak shaving, net metering, battery storage, system sizing, installation costs, savings, and ROI. Get instant solar panel estimates.',
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

