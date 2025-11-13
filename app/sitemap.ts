import { MetadataRoute } from 'next'

// Generate sitemap for search engines to discover all pages
export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable if available, otherwise fallback to production domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                 'https://www.solarcalculatorcanada.org')
  
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
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/peak-shaving-sales-calculator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}













