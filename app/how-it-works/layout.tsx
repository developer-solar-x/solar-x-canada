import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works | Solar Calculator Process | Solar Calculator Canada',
  description: 'Learn how our solar calculator works. Simple, transparent process from estimate to installation. Understand our vetting process and double warranty protection.',
  keywords: [
    'how solar calculator works',
    'solar estimate process',
    'solar installation process',
    'solar calculator canada',
    'solar vetting process',
    'solar warranty',
  ],
  openGraph: {
    title: 'How It Works | Solar Calculator Process',
    description: 'Learn how our solar calculator works. Simple, transparent process from estimate to installation.',
    url: 'https://www.solarcalculatorcanada.org/how-it-works',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/how-it-works',
  },
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
