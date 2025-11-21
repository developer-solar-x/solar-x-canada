'use client'

// Installer testimonials/reviews page (mock UI, no backend)

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Star, MessageSquare, ThumbsUp, Reply } from 'lucide-react'
import Link from 'next/link'

interface Testimonial {
  id: string
  customerName: string
  rating: number
  review: string
  date: string
  projectType: string
  response?: string
  respondedAt?: string
}

export default function TestimonialsPage() {
  // Mock testimonials - will be replaced with real data when backend is connected
  const [testimonials] = useState<Testimonial[]>([
    {
      id: 'test-1',
      customerName: 'John Smith',
      rating: 5,
      review: 'Excellent work! The installation was completed on time and the team was very professional. Highly recommend!',
      date: '2024-01-15',
      projectType: 'Residential - 7.0 kW',
      response: 'Thank you for your kind words, John! We\'re thrilled you\'re happy with your solar system.',
      respondedAt: '2024-01-16',
    },
    {
      id: 'test-2',
      customerName: 'Sarah Johnson',
      rating: 5,
      review: 'Great experience from start to finish. The team explained everything clearly and the installation was seamless.',
      date: '2024-01-10',
      projectType: 'Residential - 10.5 kW',
    },
    {
      id: 'test-3',
      customerName: 'Mike Chen',
      rating: 4,
      review: 'Good quality work and fair pricing. Minor delay in scheduling but overall satisfied with the result.',
      date: '2024-01-05',
      projectType: 'Commercial - 50.0 kW',
      response: 'Thank you for your feedback, Mike. We appreciate your patience and are glad you\'re satisfied!',
      respondedAt: '2024-01-06',
    },
  ])

  const [selectedTestimonial, setSelectedTestimonial] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  const averageRating = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length

  const handleSubmitResponse = (testimonialId: string) => {
    // TODO: Submit response to backend
    console.log('Submitting response:', responseText)
    setResponseText('')
    setSelectedTestimonial(null)
    alert('Response submitted! (Mock - no backend connected)')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/for-installers/dashboard" 
            className="text-white/80 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold font-display">Customer Reviews</h1>
          <p className="text-white/90 mt-2">Manage and respond to customer testimonials</p>
        </div>
      </section>

      {/* Testimonials Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <Star className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= averageRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="text-sky-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-900">{testimonials.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <ThumbsUp className="text-green-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round((testimonials.filter(t => t.response).length / testimonials.length) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials List */}
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{testimonial.customerName}</h3>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{testimonial.projectType}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(testimonial.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{testimonial.review}</p>

                {/* Response Section */}
                {testimonial.response ? (
                  <div className="bg-forest-50 rounded-lg p-4 border-l-4 border-forest-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply size={16} className="text-forest-600" />
                      <span className="text-sm font-semibold text-forest-600">Your Response</span>
                      <span className="text-xs text-gray-500">
                        ({new Date(testimonial.respondedAt!).toLocaleDateString()})
                      </span>
                    </div>
                    <p className="text-gray-700">{testimonial.response}</p>
                  </div>
                ) : (
                  <div>
                    {selectedTestimonial === testimonial.id ? (
                      <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Write a Response
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          placeholder="Thank the customer for their review..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-3"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSubmitResponse(testimonial.id)}
                            className="btn-primary text-sm"
                          >
                            Submit Response
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTestimonial(null)
                              setResponseText('')
                            }}
                            className="btn-outline text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedTestimonial(testimonial.id)}
                        className="btn-outline text-sm"
                      >
                        <Reply size={16} className="mr-2" />
                        Respond to Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {testimonials.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-md text-center">
              <MessageSquare className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600">No reviews yet.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

