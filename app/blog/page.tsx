'use client'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { blogPosts } from '@/lib/blog-data'
import { Calendar, Clock, ArrowRight, Zap, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

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
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-gray-50">
      <Header />

      {/* Hero Section - Modern & Eye-catching */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="text-amber-500 w-5 h-5" />
              <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Solar Energy Insights</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-forest-600 via-forest-500 to-blue-600 mb-6 leading-tight">
              Illuminate Your Solar Journey
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed font-light mb-8">
              Expert guides, cutting-edge insights, and actionable strategies to transform your home with clean energy. Discover the facts, incentives, and solutions that power smarter decisions about solar in Canada.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">{blogPosts.length} Expert Articles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Latest Industry Trends</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hydro One Banner */}
      <section className="relative py-16 bg-gradient-to-r from-forest-600 via-blue-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Hydro One Solar Guide Available
              </h2>
              <p className="text-white/90 mb-6 text-lg leading-relaxed">
                Complete guide to installing solar with Hydro One. Learn about connection fees, net metering, grid capacity, and maximize your savings across Ontario's service areas including Barrie, Collingwood, Peterborough, North Bay, and more.
              </p>
              <Link
                href="/blog/hydro-one-solar-connection-guide"
                className="inline-flex items-center gap-2 bg-white text-forest-600 hover:bg-amber-50 font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                Read Hydro One Solar Guide
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Connection Fees ($500-$2,000)</h3>
                    <p className="text-white/70 text-sm">Detailed breakdown of Hydro One connection costs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Net Metering Rules</h3>
                    <p className="text-white/70 text-sm">Maximize credits and annual electricity bill savings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white">Grid Capacity & 16 Cities</h3>
                    <p className="text-white/70 text-sm">Check capacity for your Hydro One service area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter - Enhanced */}
          <div className="mb-16">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-6">Filter by Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`group relative px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-forest-600 to-blue-600 text-white shadow-lg shadow-forest-500/30 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {category.label}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      activeCategory === category.id
                        ? 'bg-white/30'
                        : 'bg-gray-300'
                    }`}>
                      {category.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid - Stunning Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className="group relative h-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-forest-300 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-forest-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className="p-8 flex flex-col h-full">
                    {/* Category Badge - Gradient */}
                    <div className="mb-5">
                      <span className="inline-block px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 uppercase tracking-wide">
                        {categories.find(c => c.id === post.category)?.label || post.category}
                      </span>
                    </div>

                    {/* Title - Elegant */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-forest-600 transition-colors duration-300 leading-tight">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-6 line-clamp-3 flex-grow leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Meta Info - Refined */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 py-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-forest-500" />
                        <span className="font-medium">{formatDate(post.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <span className="font-medium">{post.readTime} min</span>
                      </div>
                    </div>

                    {/* Read More - CTA */}
                    <div className="flex items-center text-forest-600 font-semibold text-sm group-hover:text-forest-700 transition-colors">
                      Explore Article
                      <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No articles in this category yet.</p>
                <p className="text-gray-500 mt-2">Check back soon for fresh insights!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Bold & Engaging */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-forest-600 via-blue-600 to-forest-700"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Go Solar?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop paying high energy bills. Start generating your own clean power. Our free calculator estimates your savings in just 60 seconds.
          </p>
          <Link
            href="/estimator"
            className="inline-flex items-center justify-center gap-2 bg-white text-forest-600 hover:bg-amber-50 text-lg font-bold h-16 px-12 rounded-full transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            Get Your Free Solar Estimate
          </Link>
          <p className="text-white/70 text-sm mt-6">No credit card required. Takes 2-3 minutes.</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
