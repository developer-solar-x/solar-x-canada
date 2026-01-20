import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solar Power Cost in Canada | Average Prices & Cost Breakdown | Solar Calculator Canada',
  description: 'Understand solar power costs in Canada. Learn about average prices by province, cost factors, typical cost breakdown, and return on investment. Get informed before going solar.',
  keywords: [
    'solar power cost canada',
    'solar panel cost',
    'solar installation cost',
    'solar system price',
    'solar cost per watt',
    'solar roi',
    'solar payback period',
    'solar investment',
  ],
  openGraph: {
    title: 'Solar Power Cost in Canada | Average Prices & Cost Breakdown',
    description: 'Understand solar power costs in Canada. Learn about average prices by province, cost factors, and return on investment.',
    url: 'https://www.solarcalculatorcanada.org/solar-power-cost',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/solar-power-cost',
  },
}

export default function SolarPowerCostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
