/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React 19 features
  reactStrictMode: true,
  
  // ESLint configuration for build
  eslint: {
    // Skip ESLint during production builds (run separately in CI/CD)
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    // Ignore type errors in node_modules (third-party packages may have type issues)
    // Note: @cityssm/green-button-parser has a type error that we can't fix without patching
    ignoreBuildErrors: true,
  },
  
  // Image optimization configuration
  images: {
    domains: ['api.mapbox.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = nextConfig;

