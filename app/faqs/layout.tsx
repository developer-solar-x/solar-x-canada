import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs | Frequently Asked Questions | Solar Calculator Canada',
  description: 'Find answers to frequently asked questions about solar energy, our calculator, installer vetting, warranties, costs, and more. Everything you need to know about going solar.',
  keywords: [
    'solar faqs',
    'solar questions',
    'solar calculator questions',
    'solar installation faq',
    'solar energy questions',
    'solar rebates faq',
    'solar cost questions',
  ],
  openGraph: {
    title: 'FAQs | Frequently Asked Questions',
    description: 'Find answers to frequently asked questions about solar energy, our calculator, installer vetting, and more.',
    url: 'https://www.solarcalculatorcanada.org/faqs',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/faqs',
  },
}

export default function FAQsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
