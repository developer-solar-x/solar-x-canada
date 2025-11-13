import type { Metadata } from 'next'

// Page-specific metadata for SEO
export const metadata: Metadata = {
  title: 'Peak Shaving Sales Calculator | Solar Battery ROI Calculator Canada',
  description: 'Professional peak shaving calculator for solar sales. Calculate TOU vs ULO savings, battery ROI, and payback period. Free tool for solar sales professionals in Canada.',
  keywords: [
    'peak shaving sales calculator',
    'solar sales calculator',
    'battery roi calculator',
    'tou ulo comparison tool',
    'solar sales tool canada',
    'battery savings calculator',
  ],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/peak-shaving-sales-calculator',
  },
  openGraph: {
    title: 'Peak Shaving Sales Calculator | Solar Battery ROI Calculator Canada',
    description: 'Professional peak shaving calculator for solar sales. Calculate TOU vs ULO savings and battery ROI.',
    url: 'https://www.solarcalculatorcanada.org/peak-shaving-sales-calculator',
  },
}

export default function PeakShavingSalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

