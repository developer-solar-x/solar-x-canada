import { MetadataRoute } from 'next'

// Generate sitemap for search engines to discover all pages
export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable if available, otherwise fallback to production domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                 'https://www.solarcalculatorcanada.org')
  
  return [
    // Homepage - Highest priority
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Main calculator tools - High priority
    {
      url: `${baseUrl}/estimator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/peak-shaving-sales-calculator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Information pages - Medium priority
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Installer pages - Medium priority
    {
      url: `${baseUrl}/for-installers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-installers/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/for-installers/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}













