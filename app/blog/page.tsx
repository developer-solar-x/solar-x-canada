import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { blogPosts } from '@/lib/blog-data'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'

export const metadata: Metadata = {
  title: 'Solar Energy Blog | Expert Guides, Tips & News | Solar Calculator Canada',
  description: 'Expert solar energy guides, tips, and news for Canadian homeowners. Learn about solar panels, battery storage, net metering, costs, incentives, and more. Stay informed about the latest in solar technology.',
  keywords: [
    'solar blog',
    'solar energy blog canada',
    'solar panel guides',
    'solar tips',
    'solar news canada',
    'solar information',
    'solar education',
    'solar articles',
  ],
  openGraph: {
    title: 'Solar Energy Blog | Expert Guides & Tips | Solar Calculator Canada',
    description: 'Expert solar energy guides, tips, and news for Canadian homeowners. Learn about solar panels, battery storage, net metering, and more.',
    type: 'website',
    url: 'https://www.solarcalculatorcanada.org/blog',
  },
  alternates: {
    canonical: 'https://www.solarcalculatorcanada.org/blog',
  },
}

const categories = [
  { id: 'all', label: 'All Posts', count: blogPosts.length },
  { id: 'solar-basics', label: 'Solar Basics', count: blogPosts.filter(p => p.category === 'solar-basics').length },
  { id: 'solar-technology', label: 'Technology', count: blogPosts.filter(p => p.category === 'solar-technology').length },
  { id: 'solar-finance', label: 'Finance', count: blogPosts.filter(p => p.category === 'solar-finance').length },
  { id: 'solar-installation', label: 'Installation', count: blogPosts.filter(p => p.category === 'solar-installation').length },
  { id: 'solar-maintenance', label: 'Maintenance', count: blogPosts.filter(p => p.category === 'solar-maintenance').length },
] as const

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]['id']>('all')

  const filteredPosts = useMemo(
    () => (activeCategory === 'all' ? blogPosts : blogPosts.filter((post) => post.category === activeCategory)),
    [activeCategory]
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-forest-500 to-forest-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
              Solar Energy Blog
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Expert guides, tips, and insights to help you make informed decisions about solar energy in Canada. Learn about costs, incentives, technology, and best practices.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors font-medium ${
                    activeCategory === category.id
                      ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-forest-50 hover:border-forest-500 hover:text-forest-700'
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-forest-100 text-forest-700">
                        {categories.find(c => c.id === post.category)?.label || post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-forest-900 mb-3 line-clamp-2 hover:text-forest-600 transition-colors">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="flex items-center text-forest-600 font-medium text-sm group">
                      Read more
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center text-gray-600 py-12 border border-dashed border-gray-200 rounded-xl">
                No posts yet in this category. Check back soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-sky-50 to-forest-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-forest-900 mb-4">
            Ready to Go Solar?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Use our free calculator to estimate your solar savings and get connected with vetted installers.
          </p>
          <Link
            href="/estimator"
            className="btn-primary inline-flex items-center justify-center text-lg h-14 px-10"
          >
            Get Your Free Solar Estimate
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
