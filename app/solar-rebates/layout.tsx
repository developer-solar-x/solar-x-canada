import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solar Rebates in Canada | Federal & Provincial Incentives | Solar Calculator Canada',
  description: 'Discover available solar rebates and incentives across Canada. Learn about federal and provincial programs, eligibility requirements, and how rebates can reduce your solar investment.',
  keywords: [
    'solar rebates canada',
    'solar incentives',
    'solar rebates ontario',
    'solar rebates alberta',
    'solar rebates bc',
    'federal solar rebates',
    'provincial solar rebates',
    'solar tax credits',
  ],
  openGraph: {
    title: 'Solar Rebates in Canada | Federal & Provincial Incentives',
    description: 'Discover available solar rebates and incentives across Canada. Learn about eligibility and how rebates reduce your solar investment.',
    url: 'https://www.solarcalculatorcanada.org/solar-rebates',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/solar-rebates',
  },
}

export default function SolarRebatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
