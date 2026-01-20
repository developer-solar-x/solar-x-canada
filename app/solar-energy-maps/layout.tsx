import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solar Energy Maps | Solar Potential by Province | Solar Calculator Canada',
  description: 'Explore solar energy potential across Canada by province and region. Learn about sun hours, solar potential ratings, and location-specific solar production estimates.',
  keywords: [
    'solar energy maps canada',
    'solar potential canada',
    'solar sun hours',
    'solar potential by province',
    'solar irradiance canada',
    'solar production canada',
    'solar energy potential',
  ],
  openGraph: {
    title: 'Solar Energy Maps | Solar Potential by Province',
    description: 'Explore solar energy potential across Canada by province and region. Learn about sun hours and location-specific solar production.',
    url: 'https://www.solarcalculatorcanada.org/solar-energy-maps',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/solar-energy-maps',
  },
}

export default function SolarEnergyMapsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
