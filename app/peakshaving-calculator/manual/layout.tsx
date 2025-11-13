import type { Metadata } from 'next'

// Page-specific metadata for SEO
export const metadata: Metadata = {
  title: 'Battery Peak Shaving Calculator Canada | Solar + Battery Savings',
  description: 'Calculate solar + battery savings with peak shaving in Canada. Compare TOU vs ULO rate plans. See how battery storage reduces peak electricity costs. Free calculator for Ontario, BC, Alberta homeowners.',
  keywords: [
    'battery peak shaving calculator',
    'solar battery calculator canada',
    'tou vs ulo calculator',
    'battery storage savings',
    'peak shaving canada',
    'solar battery ontario',
    'time of use calculator',
    'battery rebate calculator',
    'solar + battery savings',
  ],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/peakshaving-calculator/manual',
  },
  openGraph: {
    title: 'Battery Peak Shaving Calculator Canada | Solar + Battery Savings',
    description: 'Calculate solar + battery savings with peak shaving in Canada. Compare TOU vs ULO rate plans.',
    url: 'https://www.solarcalculatorcanada.org/peakshaving-calculator/manual',
  },
}

export default function PeakShavingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

