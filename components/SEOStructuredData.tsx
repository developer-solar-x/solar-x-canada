'use client'

// Structured Data component for SEO
export function SEOStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SolarX',
    url: 'https://www.solarcalculatorcanada.org',
    logo: 'https://www.solarcalculatorcanada.org/logo.png',
    description: 'Free solar panel calculator and estimate tool for Canadian homeowners. Calculate solar costs, savings, and ROI instantly.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SolarX - Free Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    description: 'Free solar panel calculator and estimate tool for Canadian homeowners',
    inLanguage: 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.solarcalculatorcanada.org/estimator?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Solar Panel Installation Consultation',
    provider: {
      '@type': 'Organization',
      name: 'SolarX',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    description: 'Free solar panel cost and savings calculator for Canadian homeowners. Get instant estimates for solar panel installation costs, savings, and ROI.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CAD',
      description: 'Free solar estimate and calculator',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  )
}

