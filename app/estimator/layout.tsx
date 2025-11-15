import type { Metadata } from 'next'

// Page-specific metadata for SEO
export const metadata: Metadata = {
  title: 'Solar Panel Estimator Canada | Free Solar Quote & Cost Calculator',
    description: 'Get your free solar panel estimate in Canada. Calculate solar installation costs, savings, ROI, and payback period. Instant quotes for Ontario, BC, Alberta & all provinces.',
  keywords: [
    'solar panel estimator canada',
    'solar quote canada',
    'solar cost calculator',
    'solar installation estimate',
    'solar panel cost canada',
    'solar calculator ontario',
    'solar calculator toronto',
    'solar calculator vancouver',
    'free solar quote',
    'solar panel savings calculator',
  ],
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/estimator',
  },
  openGraph: {
    title: 'Solar Panel Estimator Canada | Free Solar Quote & Cost Calculator',
    description: 'Get your free solar panel estimate in Canada. Calculate solar installation costs, savings, and ROI instantly.',
    url: 'https://www.solarcalculatorcanada.org/estimator',
  },
}

export default function EstimatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

