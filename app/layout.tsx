import type { Metadata, Viewport } from 'next'
import './globals.css'

// Metadata for SEO optimization
export const metadata: Metadata = {
  title: 'SolarX - Modern Solar Solutions | Get Your Free Solar Estimate',
  description: 'Get your personalized solar estimate in 60 seconds. Join thousands of Ontario homeowners saving money and the planet with SolarX.',
  keywords: ['solar panels', 'solar energy', 'Ontario solar', 'solar installation', 'solar estimate', 'renewable energy'],
  authors: [{ name: 'SolarX' }],
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://solarx.ca',
    siteName: 'SolarX',
    title: 'SolarX - Modern Solar Solutions',
    description: 'Get your personalized solar estimate in 60 seconds',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolarX - Modern Solar Solutions',
    description: 'Get your personalized solar estimate in 60 seconds',
  },
  robots: {
    index: true,
    follow: true,
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

