import { MetadataRoute } from 'next'

// Generate sitemap for search engines to discover all pages
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.solarcalculatorcanada.org'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/estimator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/peakshaving-calculator/manual`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}



