'use client'

// Structured Data component for SEO
export function SEOStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    logo: 'https://www.solarcalculatorcanada.org/logo.png',
    description: 'Free solar calculator and estimate tool for Canadian homeowners. Calculate rooftop solar systems, peak shaving, net metering, battery storage, system sizing, costs, savings, and ROI instantly.',
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
    name: 'Free Solar Calculator Canada',
    url: 'https://www.solarcalculatorcanada.org',
    description: 'Free solar calculator and estimate tool for Canadian homeowners. Calculate rooftop solar, peak shaving, net metering, battery storage, and system sizing.',
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
      name: 'Solar Calculator Canada',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Canada',
    },
    description: 'Free solar calculator for Canadian homeowners. Calculate rooftop solar systems, peak shaving, net metering, battery storage, system sizing, installation costs, savings, and ROI. Get instant solar panel estimates.',
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

