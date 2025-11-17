import type { Metadata } from 'next'

// Page-specific metadata for SEO
export const metadata: Metadata = {
  title: 'Solar Panel Estimator Canada | Free Solar Quote & Cost Calculator',
    description: 'Get your free solar panel estimate for Canada. Calculate solar costs, savings, and ROI instantly.',
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
    description: 'Get your free solar panel estimate for Canada. Calculate solar costs, savings, and ROI instantly.',
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

