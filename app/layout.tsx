import type { Metadata, Viewport } from 'next'
import './globals.css'

// Metadata for SEO optimization
export const metadata: Metadata = {
  metadataBase: new URL('https://www.solarcalculatorcanada.org'),
  title: 'SolarX - Modern Solar Solutions | Get Your Free Solar Estimate',
  description: 'Get your personalized solar estimate in minutes. Join thousands of Ontario homeowners saving money and the planet with SolarX.',
  keywords: ['solar panels', 'solar energy', 'Ontario solar', 'solar installation', 'solar estimate', 'renewable energy', 'solar calculator canada'],
  authors: [{ name: 'SolarX' }],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://www.solarcalculatorcanada.org',
    siteName: 'SolarX',
    title: 'SolarX - Modern Solar Solutions',
    description: 'Get your personalized solar estimate in minutes',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolarX - Modern Solar Solutions',
    description: 'Get your personalized solar estimate in minutes',
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
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

