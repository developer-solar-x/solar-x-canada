import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getBlogPost, getRelatedPosts } from '@/lib/blog-data'
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, Share2, Zap, BookOpen, ChevronDown, HelpCircle, CheckCircle, AlertCircle, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { FAQSection } from '@/components/blog/FAQAccordion'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found | Solar Calculator Canada Blog',
    }
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      tags: post.tags,
      url: `https://www.solarcalculatorcanada.org/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
    },
    alternates: {
      canonical: `https://www.solarcalculatorcanada.org/blog/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  const { blogPosts } = await import('@/lib/blog-data')
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)
  const relatedPosts = getRelatedPosts(slug, 3)

  if (!post) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const categoryLabels: Record<string, string> = {
    'solar-basics': 'Solar Basics',
    'solar-technology': 'Technology',
    'solar-finance': 'Finance',
    'solar-installation': 'Installation',
    'solar-maintenance': 'Maintenance',
    'solar-news': 'News',
  }

  // Custom markdown components for react-markdown
  const markdownComponents = {
    h1: ({ node, ...props }: any) => <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
    h2: ({ node, ...props }: any) => (
      <div className="group mt-12 mb-6">
        <h2 className="text-3xl font-bold bg-clip-text bg-gradient-to-r from-forest-600 via-forest-500 to-blue-600 text-transparent relative inline-block pb-3 border-b-4 border-gradient-to-r from-forest-400 to-blue-400 group-hover:border-forest-500 transition-colors duration-300" {...props} />
        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-forest-500 to-blue-500 group-hover:w-full transition-all duration-500"></div>
      </div>
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pl-4 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-forest-500 before:to-blue-500 hover:text-forest-600 transition-colors duration-300" {...props} />
    ),
    p: ({ node, ...props }: any) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-forest-600 no-underline font-semibold hover:underline" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="text-gray-900 font-bold" {...props} />,
    code: ({ node, ...props }: any) => <code className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm" {...props} />,
    pre: ({ node, ...props }: any) => <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-forest-500 bg-forest-50 text-forest-900 pl-4 py-2 my-4" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="text-gray-700 list-disc list-inside space-y-2 mb-4" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="text-gray-700 list-decimal list-inside space-y-2 mb-4" {...props} />,
    li: ({ node, ...props }: any) => <li className="text-gray-700" {...props} />,
    table: ({ node, ...props }: any) => <table className="w-full border-collapse border border-gray-300 mb-4" {...props} />,
    th: ({ node, ...props }: any) => <th className="bg-gray-100 text-gray-900 font-bold border border-gray-300 px-4 py-2" {...props} />,
    td: ({ node, ...props }: any) => <td className="text-gray-700 border border-gray-300 px-4 py-2" {...props} />,
  }

  // Function to render content with special FAQ styling
  const renderContent = (content: string) => {
    // Split content by FAQ section
    const parts = content.split(/## Frequently Asked Questions \(FAQ\)/i)
    
    if (parts.length === 1) {
      return <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    }

    const beforeFAQ = parts[0]
    const faqContent = parts[1]

    return (
      <>
        <ReactMarkdown components={markdownComponents}>{beforeFAQ}</ReactMarkdown>

        {/* Custom FAQ Section */}
        <div className="mt-16 pt-16 border-t-2 border-gradient-to-r from-forest-200 to-blue-200">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <HelpCircle className="w-10 h-10 text-forest-600" />
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 mb-8">Find answers to common questions about our solar solutions</p>

          <FAQSection faqContent={faqContent} />
        </div>
      </>
    )
  }

  // Structured data for SEO
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || 'https://www.solarcalculatorcanada.org/logo.png',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Solar Calculator Canada',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.solarcalculatorcanada.org/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.solarcalculatorcanada.org/blog/${slug}`,
    },
    ...(slug.includes('hydro-one') && {
      // Enhanced local SEO for Hydro One blog
      areaServed: [
        { '@type': 'City', name: 'Barrie', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Collingwood', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Muskoka', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Bracebridge', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Huntsville', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Peterborough', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'North Bay', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Sudbury', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Kawartha Lakes', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'City', name: 'Nipissing', addressRegion: 'Ontario', addressCountry: 'CA' },
        { '@type': 'State', name: 'Ontario', addressCountry: 'CA' },
      ],
      // FAQ Schema for local SEO boost
      mentions: [
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How much does Hydro One solar connection cost?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hydro One solar connection fees typically range from $500 to $2,000 depending on system size, location, and required infrastructure upgrades.',
              },
            },
            {
              '@type': 'Question',
              name: 'How long does Hydro One solar approval take?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The approval timeline is typically 4-6 months for straightforward cases, though it can take up to 12+ months in areas with grid capacity constraints.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does Hydro One have grid capacity limits?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, some Hydro One service territories have grid capacity constraints. Areas like Muskoka and Cottage Country have experienced capacity challenges and may require battery storage or size limitations.',
              },
            },
          ],
        },
      ],
    }),
  }

  // Breadcrumb Schema for local SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.solarcalculatorcanada.org',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://www.solarcalculatorcanada.org/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.solarcalculatorcanada.org/blog/${slug}`,
      },
    ],
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Header />

      {/* Article Header - Premium Design */}
      <article className="relative pt-24 pb-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <Link
            href="/blog"
            className="inline-flex items-center text-forest-600 hover:text-forest-700 font-semibold mb-8 group transition-colors duration-300"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Blog
          </Link>

          {/* Category Badge - Premium */}
          <div className="mb-6 flex items-center gap-4">
            <span className="inline-block px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 uppercase tracking-wide">
              {categoryLabels[post.category] || post.category}
            </span>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <BookOpen size={16} />
              <span className="font-medium">{post.readTime} min read</span>
            </div>
          </div>

          {/* Title - Stunning Typography */}
          <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-forest-600 via-forest-500 to-blue-600 mb-8 leading-tight pr-8">
            {post.title}
          </h1>

          {/* Meta Information - Refined */}
          <div className="flex flex-wrap items-center gap-8 text-gray-600 mb-10 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-blue-500 flex items-center justify-center text-white">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Published</p>
                <p className="font-semibold text-gray-900">{formatDate(post.publishedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Reading Time</p>
                <p className="font-semibold text-gray-900">{post.readTime} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">By</p>
                <p className="font-semibold text-gray-900">{post.author}</p>
              </div>
            </div>
          </div>

          {/* Tags - Enhanced */}
          {post.tags.length > 0 && (
            <div className="mb-10 flex flex-wrap gap-3">
              {post.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-forest-100 hover:text-forest-700 transition-colors duration-300"
                >
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Article Content - Beautiful Typography */}
          <div>
            {renderContent(post.content)}
          </div>

          {/* Share & CTA Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Share */}
              <div className="lg:col-span-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Share Article</h3>
                <div className="flex gap-3">
                  <button className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white transition-all duration-300">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* CTA Section - Bold */}
              <div className="lg:col-span-2 bg-gradient-to-r from-forest-600 via-blue-600 to-cyan-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-2xl"></div>
                </div>
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-3">
                    Ready to Calculate Your Solar Savings?
                  </h2>
                  <p className="text-white/90 mb-6 leading-relaxed">
                    Use our free solar calculator to estimate your potential savings, determine the right system size, and see your payback period with federal incentives included.
                  </p>
                  <Link
                    href="/estimator"
                    className="inline-flex items-center gap-2 bg-white text-forest-600 hover:bg-amber-50 font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <Zap className="w-5 h-5" />
                    Get Your Free Estimate
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts - Engaging Section */}
      {relatedPosts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Explore More Insights
              </h2>
              <p className="text-gray-600 text-lg">Continue your solar education with these related articles</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-forest-300 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="p-8 flex flex-col h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-forest-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="relative">
                      <span className="inline-block px-4 py-2 text-xs font-bold rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide mb-4">
                        {categoryLabels[relatedPost.category] || relatedPost.category}
                      </span>

                      <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-forest-600 transition-colors duration-300">
                        {relatedPost.title}
                      </h3>

                      <p className="text-gray-600 line-clamp-3 mb-6 flex-grow">
                        {relatedPost.excerpt}
                      </p>

                      <div className="flex items-center text-forest-600 font-semibold text-sm group-hover:text-forest-700 transition-colors">
                        Explore Article
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Footer />
    </main>
  )
}
