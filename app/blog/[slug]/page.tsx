import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getBlogPost, getRelatedPosts } from '@/lib/blog-data'
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Article Header */}
      <article className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Blog */}
          <Link
            href="/blog"
            className="inline-flex items-center text-forest-600 hover:text-forest-700 font-medium mb-8 group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-forest-100 text-forest-700">
              {categoryLabels[post.category] || post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-forest-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{post.readTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <span>By {post.author}</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-forest-900 prose-headings:font-bold prose-a:text-forest-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-forest-900 prose-code:text-forest-700 prose-code:bg-forest-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-gradient-to-br from-sky-50 to-forest-50 rounded-xl border border-forest-200">
            <h2 className="text-2xl font-bold text-forest-900 mb-4">
              Ready to Calculate Your Solar Savings?
            </h2>
            <p className="text-gray-700 mb-6">
              Use our free solar calculator to estimate your potential savings, system size, and payback period.
            </p>
            <Link
              href="/estimator"
              className="btn-primary inline-flex items-center justify-center"
            >
              Get Your Free Solar Estimate
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-forest-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-forest-100 text-forest-700">
                      {categoryLabels[relatedPost.category] || relatedPost.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-forest-900 mb-2 line-clamp-2 hover:text-forest-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-forest-600 font-medium">
                    Read more
                    <ArrowRight size={14} className="ml-2" />
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

      <Footer />
    </main>
  )
}
