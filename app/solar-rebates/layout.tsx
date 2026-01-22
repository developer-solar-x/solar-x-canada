import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solar Rebates & Incentives Canada 2026 | Solar Calculator by Province',
  description: 'Compare solar rebates, tax credits, and incentives across Canada. Get province-specific solar calculator data, CEIP financing in Alberta, Home Renovation Savings in Ontario, and energy efficiency programs.',
  keywords: [
    'solar rebates Canada',
    'solar incentives Canada',
    'solar tax credit Canada',
    'solar calculator Canada',
    'Ontario solar rebates',
    'Alberta solar rebates',
    'BC solar rebates',
    'solar energy incentives',
    'renewable energy rebates',
    'home solar rebates',
    'solar panel rebates',
    'federal solar tax credit',
    'provincial solar incentives',
    'CEIP financing',
    'Alberta CEIP',
    'Home Renovation Savings',
    'HRS program',
    'solar power cost calculator',
    'best solar rebates',
    'solar savings calculator',
  ],
  openGraph: {
    title: 'Solar Rebates & Incentives Across Canada | Compare by Province',
    description: 'Find solar rebates, incentives, and financing options in your province. Comprehensive solar calculator for Canada.',
    type: 'website',
    url: 'https://solarcalculatorcanada.org/solar-rebates',
  },
  alternates: {
    canonical: 'https://solarcalculatorcanada.org/solar-rebates',
  },
}

export default function SolarRebatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
